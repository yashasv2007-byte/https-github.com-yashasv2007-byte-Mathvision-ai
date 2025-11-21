import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a base64 string.
 */
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes a graph image using the Gemini 2.5 Flash model.
 */
export const analyzeGraphImage = async (imageFile: File): Promise<string> => {
  try {
    const base64Image = await fileToGenerativePart(imageFile);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Image
            }
          },
          {
            text: SYSTEM_PROMPT
          }
        ]
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text generated.");
    }
    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};