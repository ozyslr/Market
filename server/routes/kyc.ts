// server/routes/kyc.ts
import { Router } from 'express';
import { adminDb, adminAuth } from '../../src/lib/firebase-admin.js';
import { getKycSettings } from '../lib/kycSettings.js';

async function verifyFirebaseToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token gerekli' });
  }
  try {
    const token = await adminAuth.verifyIdToken(authHeader.slice(7));
    (req as any).user = token;
    next();
  } catch {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}

export function registerKycRoutes(app: any) {
  const router = Router();

  // POST /api/kyc/submit — Başvuru + pipeline tetikleme
  router.post('/submit', verifyFirebaseToken, async (req: any, res: any) => {
    try {
      const userId = req.user.uid;
      const {
        applicationId,
        taxId,
        taxOffice,
        businessType,
        mersisNo,
        bankIban,
        bankAccountHolder,
        tckn,
        fullName,
      } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      // Fetch application
      const appRef = adminDb.collection('sellerApplications').doc(applicationId);
      const appSnap = await appRef.get();
      if (!appSnap.exists) return res.status(404).json({ error: 'Başvuru bulunamadı' });

      const appData = appSnap.data()!;
      const kycDocs = appData.kycDocuments || [];
      const timeline: any[] = appData.timeline || [];

      timeline.push({
        timestamp: new Date().toISOString(),
        type: 'auto_check_started',
        actor: 'system',
      });

      const settings = await getKycSettings();
      const { checkTaxIdFormat, checkIbanFormat, checkTcknFormat, checkDocumentOcr } =
        await import('../lib/kycChecks.js');

      // Run all checks (respect admin toggles)
      const checks: Record<string, any> = {
        documentOcr: settings.identityOcr
          ? await checkDocumentOcr(kycDocs)
          : {
              status: 'skipped',
              message: 'Admin tarafından devre dışı',
              checkedAt: new Date().toISOString(),
            },
        taxId: settings.taxIdVerification
          ? checkTaxIdFormat(taxId || '')
          : {
              status: 'skipped',
              message: 'Admin tarafından devre dışı',
              checkedAt: new Date().toISOString(),
            },
        mersis:
          settings.mersisCheck && mersisNo
            ? {
                status: 'pass' as const,
                message: 'MERSİS no kaydedildi (API entegrasyonu beklemede)',
                checkedAt: new Date().toISOString(),
                details: { mersisNo },
              }
            : {
                status: 'skipped' as const,
                message: settings.mersisCheck
                  ? 'MERSİS no girilmedi'
                  : 'Admin tarafından devre dışı',
                checkedAt: new Date().toISOString(),
              },
        iban: settings.ibanVerification
          ? checkIbanFormat(bankIban || '', bankAccountHolder || '')
          : {
              status: 'skipped',
              message: 'Admin tarafından devre dışı',
              checkedAt: new Date().toISOString(),
            },
        identity: settings.identityOcr
          ? checkTcknFormat(tckn || '', fullName || '')
          : {
              status: 'skipped',
              message: 'Admin tarafından devre dışı',
              checkedAt: new Date().toISOString(),
            },
      };

      // Score: each check 14 points (7 * 14 = 98) + 2 base
      let score = 2;
      const checkKeys = ['documentOcr', 'taxId', 'mersis', 'iban', 'identity'];
      for (const key of checkKeys) {
        const c = checks[key];
        if (c.status === 'pass') score += 14;
        else if (c.status === 'skipped') score += 7;
      }

      // Sert kurallı: any FAIL → pipeline FAILED
      const hasFailure = checkKeys.some((k: string) => checks[k].status === 'fail');
      const hasError = checkKeys.some((k: string) => checks[k].status === 'error');

      const autoCheck = {
        status: hasFailure || hasError ? 'failed' : 'passed',
        checks,
        score,
        failureReason: hasFailure
          ? checkKeys
              .filter((k: string) => checks[k].status === 'fail')
              .map((k: string) => `${k}: ${checks[k].message}`)
              .join('; ')
          : undefined,
      };

      timeline.push({
        timestamp: new Date().toISOString(),
        type: 'auto_check_completed',
        actor: 'system',
        note: `Puan: ${score}/100 — ${autoCheck.status === 'passed' ? 'OTOMATIK ONAYLANABILIR' : 'MANUEL INCELEME GEREKLI'}`,
      });

      // Build update data
      const updateData: any = { autoCheck, timeline };
      if (taxId) updateData.taxId = taxId;
      if (taxOffice) updateData.taxOffice = taxOffice;
      if (businessType) updateData.businessType = businessType;
      if (mersisNo) updateData.mersisNo = mersisNo;
      if (bankIban) updateData.bankIban = bankIban;
      if (bankAccountHolder) updateData.bankAccountHolder = bankAccountHolder;

      // Auto-approve if settings allow + pipeline passed
      if (
        settings.autoApproveEnabled &&
        autoCheck.status === 'passed' &&
        score >= settings.autoApproveThreshold
      ) {
        updateData.status = 'approved';
        timeline.push({
          timestamp: new Date().toISOString(),
          type: 'approved',
          actor: 'system',
          note: `Otomatik onay — puan: ${score}/100, eşik: ${settings.autoApproveThreshold}`,
        });
      }

      await appRef.update(updateData);
      res.json({
        autoCheck,
        timeline: timeline,
        status: updateData.status || appData.status,
      });
    } catch (err: any) {
      console.error('[KYC] submit error:', err);
      res.status(500).json({ error: err.message || 'Pipeline hatası' });
    }
  });

  // POST /api/kyc/admin/review — Admin manuel onay/red
  router.post('/admin/review', verifyFirebaseToken, async (req: any, res: any) => {
    try {
      const adminUid = req.user.uid;
      const { applicationId, action, note } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action "approve" veya "reject" olmalı' });
      }
      if (action === 'reject' && (!note || note.trim().length < 10)) {
        return res.status(400).json({ error: 'Red sebebi en az 10 karakter olmalı' });
      }

      const appRef = adminDb.collection('sellerApplications').doc(applicationId);
      const appSnap = await appRef.get();
      if (!appSnap.exists) return res.status(404).json({ error: 'Başvuru bulunamadı' });

      const timeline: any[] = appSnap.data()!.timeline || [];
      timeline.push({
        timestamp: new Date().toISOString(),
        type: action === 'approve' ? 'approved' : 'rejected',
        actor: 'admin',
        actorId: adminUid,
        note: note || 'Admin onayı',
      });

      await appRef.update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: adminUid,
        reviewedAt: new Date().toISOString(),
        adminNote: note || null,
        timeline,
      });

      res.json({
        success: true,
        status: action === 'approve' ? 'approved' : 'rejected',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // KVKK consent
  router.post('/kvkk-consent', verifyFirebaseToken, async (req: any, res: any) => {
    try {
      const { applicationId } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const ua = req.headers['user-agent'] || 'unknown';

      const appRef = adminDb.collection('sellerApplications').doc(applicationId);
      const appSnap = await appRef.get();
      if (!appSnap.exists) return res.status(404).json({ error: 'Başvuru bulunamadı' });

      const consent = {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        ipAddress: ip,
        userAgent: ua,
        kvkkVersion: 'v1.0',
      };

      const timeline: any[] = appSnap.data()!.timeline || [];
      timeline.push({
        timestamp: new Date().toISOString(),
        type: 'kvkk_consented',
        actor: 'seller',
        note: `KVKK v1.0 onaylandı — IP: ${ip}`,
      });

      await appRef.update({ kvkkConsent: consent, timeline });
      res.json({ success: true, consent });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Contract sign (e-Devlet)
  router.post('/contract-sign', verifyFirebaseToken, async (req: any, res: any) => {
    try {
      const { applicationId, edevletToken } = req.body;
      const { verifyEdevletToken } = await import('../lib/edevletService.js');

      const result = await verifyEdevletToken(edevletToken);
      if (!result || !result.valid) {
        return res.status(400).json({
          error: 'e-Devlet doğrulama başarısız. Lütfen tekrar deneyin.',
        });
      }

      const appRef = adminDb.collection('sellerApplications').doc(applicationId);
      const eSignature = {
        signed: true,
        signedAt: new Date().toISOString(),
        method: 'edevlet' as const,
        edevletToken: result.token,
        contractVersion: 'v1.0',
      };

      const snap = await appRef.get();
      const timeline: any[] = snap.data()!.timeline || [];
      timeline.push({
        timestamp: new Date().toISOString(),
        type: 'contract_signed',
        actor: 'seller',
        note: `e-Devlet ile imzalandı — ${result.name} ${result.surname}`,
      });

      await appRef.update({ eSignature, timeline });
      res.json({ success: true, eSignature });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/kyc/admin/settings
  router.get('/admin/settings', verifyFirebaseToken, async (_req: any, res: any) => {
    const settings = await getKycSettings();
    res.json(settings);
  });

  // PUT /api/kyc/admin/settings
  router.put('/admin/settings', verifyFirebaseToken, async (req: any, res: any) => {
    const { updateKycSettings } = await import('../lib/kycSettings.js');
    await updateKycSettings(req.body);
    const settings = await getKycSettings();
    res.json(settings);
  });

  // GET /api/kyc/application/:id/status
  router.get('/application/:id/status', verifyFirebaseToken, async (req: any, res: any) => {
    const snap = await adminDb.collection('sellerApplications').doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'Başvuru bulunamadı' });
    const data = snap.data()!;
    res.json({
      id: snap.id,
      status: data.status,
      autoCheck: data.autoCheck || null,
      timeline: data.timeline || [],
    });
  });

  app.use('/api/kyc', router);
}
