import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { adminDb, adminAuth } = await import('@/lib/firebase-admin');

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
    }

    const { windowHours = 2, maxReminders = 2 } = await req.json();
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
    const tooOld = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    const cartsSnap = await adminDb.collection('carts')
      .orderBy('updatedAt', 'asc')
      .limit(100)
      .get();

    const results: { userId: string; email?: string; itemCount: number; status: string }[] = [];

    for (const cartDoc of cartsSnap.docs) {
      const cartData = cartDoc.data();
      const userId = cartDoc.id;
      const updatedAt = cartData.updatedAt || '';
      const items = cartData.items || [];

      if (!items.length) continue;
      if (updatedAt > cutoff || updatedAt < tooOld) continue;

      const remindersSnap = await adminDb.collection('cart_reminders')
        .where('userId', '==', userId)
        .orderBy('sentAt', 'desc')
        .limit(1)
        .get();

      if (!remindersSnap.empty) {
        const lastReminder = remindersSnap.docs[0].data();
        if (lastReminder.count >= maxReminders) {
          results.push({ userId, itemCount: items.length, status: 'max_reminders_reached' });
          continue;
        }
        const lastSent = new Date(lastReminder.sentAt).getTime();
        if (Date.now() - lastSent < 24 * 60 * 60 * 1000) {
          results.push({ userId, itemCount: items.length, status: 'too_soon' });
          continue;
        }
      }

      let userEmail = '';
      try {
        if (adminAuth) {
          const userRecord = await adminAuth.getUser(userId);
          userEmail = userRecord.email || '';
        }
      } catch { /* noop */ }

      if (!userEmail) {
        results.push({ userId, itemCount: items.length, status: 'no_email' });
        continue;
      }

      const productNames = items.slice(0, 5).map((i: any) => i.productId).join(', ');
      const itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mercora.app';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8F8FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;max-width:100%;">
        <tr><td style="background:linear-gradient(135deg,#7C3AED,#1A1033);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-1px;font-style:italic;">MERCORA</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">🛒</div>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1A1033;">Sepetinde ${itemCount} ürün kaldı!</h2>
          <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6;">
            Sepetine eklediğin ürünler hala seni bekliyor.<br>
            Kaçırmadan tamamlamak ister misin?
          </p>
          <a href="${appUrl}/cart"
             style="display:inline-block;padding:14px 36px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
            Sepete Dön
          </a>
          <p style="margin:20px 0 0;font-size:10px;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
            ${items.length} farklı ürün sepetinde seni bekliyor
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#F8F8FA;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:10px;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
            Mercora Global Marketplace · Bu email otomatik gönderilmiştir
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const reminderCount = remindersSnap.empty ? 0 : remindersSnap.docs[0].data().count;
      await adminDb.collection('mail').add({
        to: userEmail,
        message: {
          subject: `Sepetinde ${itemCount} ürün kaldı — Mercora`,
          html: emailHtml,
        },
      });

      await adminDb.collection('cart_reminders').add({
        userId,
        sentAt: new Date().toISOString(),
        count: (reminderCount || 0) + 1,
        items: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })),
        cartUpdatedAt: updatedAt,
      });

      results.push({ userId, email: userEmail, itemCount: items.length, status: 'sent' });
      console.log(`Abandoned cart email sent to ${userEmail} (${itemCount} items)`);
    }

    return NextResponse.json({ checked: cartsSnap.docs.length, results });
  } catch (err: any) {
    console.error('Abandoned cart check error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
