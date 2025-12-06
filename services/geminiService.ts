import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Edits the user's photo using Gemini 2.5 Flash Image based on a text prompt.
 */
export const editImageWithGenAI = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    // Strip the data:image/...;base64, prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          }
        ]
      }
    });

    // Check for image in response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated. The model might have refused the request due to safety filters.");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

/**
 * Analyzes the user's photo to determine their "historical vibe" using Gemini 3 Pro Preview.
 */
export const analyzeImageVibe = async (base64Image: string): Promise<string> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Analyze this person's features, expression, and current style. If they were a time traveler, which historical era would they blend into most naturally? Explain why in a fun, fortune-teller style. Keep it under 100 words."
          }
        ]
      }
    });

    return response.text || "Could not analyze the image.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Analyzes a document image to extract important points.
 */
export const analyzeDocument = async (base64Image: string): Promise<string> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "You are a professional document scanner and analyst. Analyze this image. First, identify what type of document it is. Then, extract the text and summarize the most important points, key takeaways, dates, and actionable items. Format the output with clear headings and bullet points using Markdown."
          }
        ]
      }
    });

    return response.text || "Could not analyze the document.";
  } catch (error) {
    console.error("Gemini Document Analysis Error:", error);
    throw error;
  }
};