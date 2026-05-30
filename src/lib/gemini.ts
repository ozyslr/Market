import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askShoppingAssistant(query: string, context?: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are Mercora Shopping Assistant. Mercora is a next-gen global marketplace.
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
