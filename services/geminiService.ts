import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAdvancedResponse = async (text: string, base64Image: string | null): Promise<string> => {
  try {
    const ai = getClient();
    
    // Using gemini-2.5-flash for speed and multimodal capabilities
    const modelId = 'gemini-2.5-flash';

    const parts: any[] = [];
    
    if (base64Image) {
      // Extract clean base64 string (remove data:image/png;base64, prefix if present)
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg', // Assuming jpeg/png generic handling
          data: cleanBase64
        }
      });
    }

    if (text) {
      parts.push({
        text: text
      });
    }

    if (parts.length === 0) {
      return "No input provided.";
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: "You are a specialized computational engine. Provide direct, concise answers to the user's query. If math is involved, solve it step-by-step but keep it brief. Do not introduce yourself.",
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Computation Error:", error);
    return "Error processing request. Please try again.";
  }
};