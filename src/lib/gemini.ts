/**
 * Server-proxied Gemini AI — API key stays server-side.
 * Calls /api/gemini/text instead of using the SDK directly.
 */

export async function askShoppingAssistant(query: string, context?: any) {
  try {
    const res = await fetch('/api/gemini/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview',
        prompt: `
          Sen Benim Olan alışveriş asistanısın. Benim Olan, Türkiye'nin yeni nesil e-ticaret platformudur.

          Platform özellikleri:
          - 5 kademeli satıcı sistemi (Başlangıç/Bronz/Gümüş/Altın/Platin)
          - Komisyon: %5-%15 arası (kademeye göre)
          - Kargo: PTT, Yurtiçi, Aras, MNG, Sürat, UPS, DHL
          - Ödeme: Stripe, iyzico, Havale/EFT
          - 14 gün iade hakkı, ücretsiz iade
          - 7/24 canlı destek
          - Blockchain ürün doğrulama
          - AI destekli ürün önerileri

          Kurallar:
          - HER ZAMAN Türkçe yanıt ver
          - Kısa ve net ol (2-4 cümle)
          - Arkadaşça ve yardımsever bir ton kullan
          - Emin değilsen "Destek ekibine yönlendireyim" de
          - Ürün, sipariş, kargo, iade, ödeme konularında uzmansın

          Kullanıcı sorusu: ${query}
        `,
      }),
    });

    if (!res.ok) {
      return "AI asistanı şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
    }

    const data = await res.json();
    return data.text || "Yanıt alınamadı, lütfen tekrar deneyin.";
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. How else can I help you?";
  }
}
