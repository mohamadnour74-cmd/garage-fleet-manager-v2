import { GoogleGenAI, Type } from "@google/genai";
import { FleetItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMaintenanceIssue = async (
  vehicle: FleetItem,
  issueDescription: string
): Promise<{ diagnosis: string; steps: string[] } | null> => {
  const prompt = `
    Act as a senior mechanic advisor.
    Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.type})
    Mileage/Hours: ${vehicle.currentMeter}
    Issue Description: ${issueDescription}

    Provide a likely diagnosis and a list of 3-5 recommended inspection steps.
    Keep it concise and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return null;
  }
};