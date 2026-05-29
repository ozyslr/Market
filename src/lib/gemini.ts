import { GoogleGenAI } from "@google/genai";

function getAI() {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export async function askShoppingAssistant(query: string, context?: any) {
  const ai = getAI();
  if (!ai) {
    return "AI asistanı şu an kullanılamıyor. (API anahtarı eksik)";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
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
    });
    return response.text;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. How else can I help you?";
  }
}
