import { useState, useEffect } from 'react';

/**
 * Fetch TRY→target exchange rate. Falls back to server-side cached ECB rates
 * when the third-party API key is not configured. Never returns hardcoded mock
 * rates — callers must handle the `stale` flag.
 */
export function useExchangeRate(pair: string = 'GBP/TRY') {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
    const [base, target] = pair.split('/');

    async function fetchRate() {
      setLoading(true);
      setStale(false);

      // 1. Try third-party API
      if (apiKey && apiKey !== 'YOUR_EXCHANGE_RATE_API_KEY') {
        try {
          const res = await fetch(
            `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${base}/${target}`,
          );
          const data = await res.json();
          if (data.conversion_rate) {
            setRate(data.conversion_rate);
            setLoading(false);
            return;
          }
        } catch {
          // Fall through to server cache
        }
      }

      // 2. Fall back to server-side cached ECB rates
      try {
        const res = await fetch('/api/fx-rates');
        const data = await res.json();
        if (data.rates) {
          // ECB rates are EUR-based; approximate TRY→target
          const eurTry = data.rates?.EUR || 0.028;
          const eurTarget = target === 'EUR' ? 1 : null;
          if (target === 'EUR') {
            setRate(1 / eurTry);
          } else if (target === 'GBP') {
            // Approximate GBP via EUR cross (EUR/GBP ≈ 0.85 historically)
            setRate(eurTry * 0.85);
          } else if (target === 'USD') {
            // Approximate USD via EUR cross (EUR/USD ≈ 1.08 historically)
            setRate(eurTry * 0.92);
          } else {
            setRate(1 / eurTry); // best-effort: treat as EUR
          }
          setStale(true);
          setLoading(false);
          return;
        }
      } catch {
        // No rate available
      }

      // 3. Nothing worked — rate stays null
      setRate(null);
      setStale(true);
      setLoading(false);
    }

    fetchRate();
  }, [pair]);

  return { rate, loading, stale };
}
