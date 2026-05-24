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
        You are Benim Olan Shopping Assistant. Benim Olan is a next-gen global marketplace.
        Context: ${JSON.stringify(context || {})}
        User Question: ${query}
        
        Provide helpful, concise, and professional advice about products, taxes, shipping, or market trends.
        If asked for comparison, highlight pros/cons.
      `,
    });
    return response.text;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. How else can I help you?";
  }
}
