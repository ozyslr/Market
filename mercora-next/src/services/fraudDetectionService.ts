/**
 * Fraud Detection & Risk Management (STREAM O)
 * Payment fraud, account abuse, and marketplace trust
 */

export interface FraudSignal {
  signalType: string;
  score: number; // 0-100 contribution to fraud score
  description: string;
  metadata?: Record<string, any>;
}

export interface RiskAssessment {
  overallScore: number; // 0-100 fraud risk
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: FraudSignal[];
  recommendation: 'allow' | 'review' | 'decline' | 'challenge_2fa';
  metadata?: Record<string, any>;
}

export interface ChargebackCase {
  id: string;
  transactionId: string;
  customerId: string;
  amount: number;
  reason: string;
  status: 'open' | 'under_review' | 'won' | 'lost';
  createdAt: Date;
  deadline: Date;
  evidence: string[]; // S3 URLs to evidence documents
}

class FraudDetectionService {
  private readonly LOW_RISK_THRESHOLD = 30;
  private readonly MEDIUM_RISK_THRESHOLD = 50;
  private readonly HIGH_RISK_THRESHOLD = 70;
  private readonly CRITICAL_RISK_THRESHOLD = 85;

  /**
   * Assess payment fraud risk in real-time
   */
  async assessPaymentRisk(
    userId: string,
    amount: number,
    cardToken: string,
    ipAddress: string,
    deviceFingerprint: string
  ): Promise<RiskAssessment> {
    try {
      const signals: FraudSignal[] = [];

      // Signal 1: Velocity analysis (transactions per hour/day)
      const velocityScore = await this.getVelocityRiskScore(userId);
      if (velocityScore > 0) {
        signals.push({
          signalType: 'velocity',
          score: velocityScore,
          description: `High transaction velocity: ${velocityScore}% risk`,
        });
      }

      // Signal 2: Amount anomaly
      const amountScore = await this.getAmountAnomalyScore(userId, amount);
      if (amountScore > 0) {
        signals.push({
          signalType: 'amount_anomaly',
          score: amountScore,
          description: `Unusual transaction amount: ${amountScore}% risk`,
        });
      }

      // Signal 3: Device fingerprint (new device?)
      const deviceScore = await this.getDeviceRiskScore(userId, deviceFingerprint);
      if (deviceScore > 0) {
        signals.push({
          signalType: 'device_risk',
          score: deviceScore,
          description: `Unrecognized device: ${deviceScore}% risk`,
        });
      }

      // Signal 4: Geographic anomaly
      const geoScore = await this.getGeographicAnomalyScore(userId, ipAddress);
      if (geoScore > 0) {
        signals.push({
          signalType: 'geographic_anomaly',
          score: geoScore,
          description: `Unusual location: ${geoScore}% risk`,
        });
      }

      // Signal 5: Card risk (stolen, high-risk BIN)
      const cardScore = await this.getCardRiskScore(cardToken);
      if (cardScore > 0) {
        signals.push({
          signalType: 'card_risk',
          score: cardScore,
          description: `High-risk card: ${cardScore}% risk`,
        });
      }

      // Compute overall score (weighted average)
      const overallScore = signals.length > 0
        ? Math.round(signals.reduce((sum, s) => sum + s.score, 0) / signals.length)
        : 0;

      const riskLevel =
        overallScore >= this.CRITICAL_RISK_THRESHOLD
          ? 'critical'
          : overallScore >= this.HIGH_RISK_THRESHOLD
            ? 'high'
            : overallScore >= this.MEDIUM_RISK_THRESHOLD
              ? 'medium'
              : 'low';

      const recommendation =
        riskLevel === 'critical'
          ? 'decline'
          : riskLevel === 'high'
            ? 'challenge_2fa'
            : riskLevel === 'medium'
              ? 'review'
              : 'allow';

      // Log for training data
      console.log(`[Fraud] Payment risk assessment: ${overallScore}% (${riskLevel})`);

      return {
        overallScore,
        riskLevel,
        signals,
        recommendation,
        metadata: { ipAddress, cardToken: cardToken.slice(-4) },
      };
    } catch (error) {
      console.error('Assess payment risk error:', error);
      return {
        overallScore: 50,
        riskLevel: 'medium',
        signals: [],
        recommendation: 'review',
      };
    }
  }

  /**
   * Detect fake reviews
   */
  async detectFakeReview(
    reviewText: string,
    rating: number,
    userId: string,
    productId: string,
    ipAddress: string
  ): Promise<{
    isFake: boolean;
    confidence: number;
    reasons: string[];
  }> {
    try {
      const reasons: string[] = [];
      let suspicionScore = 0;

      // Check for text similarity with other reviews
      const similarityScore = await this.getTextSimilarityScore(reviewText, productId);
      if (similarityScore > 0.85) {
        suspicionScore += 25;
        reasons.push('Text matches other reviews (likely copied)');
      }

      // Check for coordinated reviews (same IP, same time)
      const coordinatedCount = await this.getCoordinatedReviewCount(ipAddress, productId);
      if (coordinatedCount > 3) {
        suspicionScore += 20;
        reasons.push(`${coordinatedCount} reviews from same IP on this product`);
      }

      // Check user review history
      const userHistoryScore = await this.getUserReviewHistoryScore(userId);
      if (userHistoryScore > 70) {
        suspicionScore += 20;
        reasons.push('Unusual user review pattern');
      }

      // Check linguistic markers (repetitive, generic, suspicious language)
      const linguisticScore = this.getLinguisticSuspicionScore(reviewText);
      if (linguisticScore > 60) {
        suspicionScore += 15;
        reasons.push('Suspicious linguistic patterns detected');
      }

      // Check rating consistency
      if (rating === 5 && reviewText.includes('but') && reviewText.includes('however')) {
        suspicionScore += 10;
        reasons.push('Rating-text inconsistency (5-star with complaints)');
      }

      const isFake = suspicionScore >= 50;
      const confidence = Math.min(suspicionScore / 100, 1);

      console.log(`[Fraud] Review authenticity: ${isFake ? 'FAKE' : 'REAL'} (${Math.round(confidence * 100)}% confidence)`);

      return { isFake, confidence, reasons };
    } catch (error) {
      console.error('Detect fake review error:', error);
      return { isFake: false, confidence: 0, reasons: [] };
    }
  }

  /**
   * Create chargeback case
   */
  async createChargebackCase(
    transactionId: string,
    customerId: string,
    amount: number,
    reason: string
  ): Promise<ChargebackCase> {
    const caseId = `chargeback_${Date.now()}`;
    const deadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000); // 45 days

    try {
      const chargebackCase: ChargebackCase = {
        id: caseId,
        transactionId,
        customerId,
        amount,
        reason,
        status: 'open',
        createdAt: new Date(),
        deadline,
        evidence: [],
      };

      // Save to Firestore
      // db.collection('chargebacks').doc(caseId).set(chargebackCase)

      console.log(`[Chargeback] Case created: ${caseId} for ${amount}`);
      return chargebackCase;
    } catch (error) {
      console.error('Create chargeback case error:', error);
      throw new Error('Failed to create chargeback case');
    }
  }

  /**
   * Upload evidence for chargeback
   */
  async uploadChargebackEvidence(
    caseId: string,
    evidence: { type: string; data: string }[] // type: 'order_confirmation', 'shipment_proof', 'communication'
  ): Promise<void> {
    try {
      // In production:
      // 1. Upload evidence documents to S3
      // 2. Update chargeback case with document URLs
      // 3. Notify merchant

      console.log(`[Chargeback] Evidence uploaded for case ${caseId}`);
    } catch (error) {
      console.error('Upload chargeback evidence error:', error);
      throw new Error('Failed to upload evidence');
    }
  }

  /**
   * Flag account for suspicious activity
   */
  async flagAccountForReview(
    userId: string,
    reason: string,
    severity: 'low' | 'medium' | 'high'
  ): Promise<void> {
    try {
      // In production:
      // 1. Set account flag in Firestore
      // 2. Create admin notification
      // 3. Apply rate limits if high severity
      // 4. Send email to user

      console.log(`[Fraud] Flagged account ${userId}: ${reason} (${severity})`);

      if (severity === 'high') {
        // Apply rate limiting, require 2FA, etc.
      }
    } catch (error) {
      console.error('Flag account error:', error);
    }
  }

  // Private helper methods

  private async getVelocityRiskScore(userId: string): Promise<number> {
    // Check transaction count in last hour
    return 0; // Placeholder
  }

  private async getAmountAnomalyScore(userId: string, amount: number): Promise<number> {
    // Compare to user's average transaction amount
    return 0; // Placeholder
  }

  private async getDeviceRiskScore(userId: string, deviceFingerprint: string): Promise<number> {
    // Check if device is registered
    return 0; // Placeholder
  }

  private async getGeographicAnomalyScore(userId: string, ipAddress: string): Promise<number> {
    // Check if location is consistent with user's history
    return 0; // Placeholder
  }

  private async getCardRiskScore(cardToken: string): Promise<number> {
    // Query card risk from Stripe or IP2Proxy
    return 0; // Placeholder
  }

  private async getTextSimilarityScore(reviewText: string, productId: string): Promise<number> {
    // Compare with other reviews for this product
    return 0; // Placeholder
  }

  private async getCoordinatedReviewCount(ipAddress: string, productId: string): Promise<number> {
    // Count reviews from same IP
    return 0; // Placeholder
  }

  private async getUserReviewHistoryScore(userId: string): Promise<number> {
    // Analyze review patterns
    return 0; // Placeholder
  }

  private getLinguisticSuspicionScore(text: string): number {
    // Check for spam patterns, generic language, etc.
    return 0; // Placeholder
  }
}

export const fraudDetectionService = new FraudDetectionService();
