import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
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
      // Parse the data URL to get the correct mime type and base64 data
      // format: data:image/png;base64,....
      const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
      let mimeType = 'image/jpeg'; // default fallback
      let data = base64Image;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        data = matches[2];
      } else {
        // Fallback for raw base64 or other formats, clean the prefix if it exists loosely
        const split = base64Image.split(',');
        if (split.length > 1) {
          data = split[1];
        }
      }

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: data
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
  } catch (error: any) {
    console.error("Computation Error:", error);
    if (error.message?.includes("API Key")) {
      return "Configuration Error: API Key is missing. Please check your .env file.";
    }
    return "Error processing request. Please try again later.";
  }
};