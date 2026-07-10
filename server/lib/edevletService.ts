// server/lib/edevletService.ts

interface EdevletVerifyResponse {
  valid: boolean;
  token: string;
  tckn: string;
  name: string;
  surname: string;
}

/**
 * Verify e-Devlet authentication token.
 * Dev mode: accepts test tokens.
 * Production: POST to e-Devlet API.
 */
export async function verifyEdevletToken(
  edevletToken: string,
): Promise<EdevletVerifyResponse | null> {
  // Dev mode: accept test tokens
  if (process.env.NODE_ENV !== 'production') {
    if (edevletToken === 'test-edevlet-valid') {
      return {
        valid: true,
        token: edevletToken,
        tckn: '12345678901',
        name: 'Test',
        surname: 'User',
      };
    }
    if (edevletToken === 'test-edevlet-invalid') {
      return null;
    }
  }

  // Production: call e-Devlet API
  try {
    const EDEVLET_API_KEY = process.env.EDEVLET_API_KEY;
    if (!EDEVLET_API_KEY) {
      console.warn('[e-Devlet] EDEVLET_API_KEY not configured');
      return null;
    }
    const res = await fetch('https://api.turkiye.gov.tr/v1/auth/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${EDEVLET_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: edevletToken }),
    });
    if (!res.ok) return null;
    return (await res.json()) as EdevletVerifyResponse;
  } catch (err) {
    console.error('[e-Devlet] API error:', err);
    return null;
  }
}
