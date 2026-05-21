'use client';

import { useState, useEffect } from 'react';

const MOCK_RATES: Record<string, number> = {
  'GBP/TRY': 43.24,
  'USD/TRY': 32.12,
  'EUR/TRY': 34.55,
};

export function useExchangeRate(pair: string = 'GBP/TRY') {
  const [rate, setRate] = useState(MOCK_RATES[pair] || 1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;

    if (!apiKey || apiKey === 'YOUR_EXCHANGE_RATE_API_KEY') {
      return;
    }

    async function fetchRate() {
      setLoading(true);
      try {
        const [base, target] = pair.split('/');
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${base}/${target}`);
        const data = await response.json();
        if (data.conversion_rate) {
          setRate(data.conversion_rate);
        }
      } catch (error) {
        console.error('Exchange Rate API Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRate();
  }, [pair]);

  return { rate, loading };
}
