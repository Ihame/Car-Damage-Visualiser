/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { DamageAnalysis } from '../types';

// Initialize the Google AI client.
// The API key is automatically sourced from the `process.env.API_KEY` environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper function to convert a File object to a Part object for the Gemini API.
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

/**
 * Generates a damage analysis report and an annotated image.
 * @param imageFile The image of the vehicle.
 * @param description A user-provided description of the vehicle or incident.
 * @param language The target language for the analysis ('en' or 'sw').
 * @returns A promise that resolves to an object containing the annotated image URL and the structured analysis data.
 */
export async function generateDamageAnalysis(
    imageFile: File,
    description: string,
    language: string,
): Promise<{ annotatedImage: string; analysis: DamageAnalysis; }> {
  const model = 'gemini-2.5-flash-image-preview';
  const imagePart = await fileToGenerativePart(imageFile);
  const targetLanguage = language === 'sw' ? 'Swahili' : 'English';

  const prompt = `
    As an expert AI vehicle damage assessor, your task is to analyze the provided image and vehicle description ("${description}").

    **Strict Output Requirements:** You MUST return exactly two items in your response:
    1.  An **edited image** that annotates the damage.
    2.  A single, valid **JSON object** with the damage analysis.

    ---

    **Image Task Details:**
    - On a new version of the input image, draw circles around all detected areas of damage.
    - **Inside or next to each circle, add a clear text label in ENGLISH** identifying the specific part (e.g., "Front Bumper", "Left Headlight"). The labels must be legible.

    ---

    **JSON Task Details:**
    - Provide a single, raw JSON object (no markdown) with the following structure:
        {
          "vehicle": {
            "make": "VEHICLE_MAKE",
            "model": "VEHICLE_MODEL",
            "year": "VEHICLE_YEAR"
          },
          "costs": [
            {
              "part": "DAMAGED_PART_NAME",
              "damage": "BRIEF_DAMAGE_DESCRIPTION",
              "suggestion": "Repair or Replace",
              "costUSD": ESTIMATED_COST_IN_USD_AS_NUMBER,
              "costRWF": ESTIMATED_COST_IN_RWF_AS_NUMBER
            }
          ]
        }
    - **Language**: All string values in the JSON ('part', 'damage', 'suggestion') MUST be professionally translated into ${targetLanguage}.
    - **Content**:
      - The 'part' name in the JSON must be the translated version of the English label from the image.
      - Identify the vehicle's make, model, and year (in English) under the "vehicle" key.
      - For each part, describe the damage, suggest "Repair" or "Replace".
    - **Costs**:
      - Estimate costs based on OEM parts and average East African labor rates.
      - Use an exchange rate of 1 USD = 1300 RWF.
      - All cost values must be numbers (e.g., 500, not "500").
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [imagePart, { text: prompt }],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let annotatedImage: string | null = null;
  let analysis: DamageAnalysis | null = null;

  if (response.candidates && response.candidates.length > 0) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const { data, mimeType } = part.inlineData;
        annotatedImage = `data:${mimeType};base64,${data}`;
      } else if (part.text) {
        try {
          const cleanedText = part.text.replace(/```json/g, '').replace(/```/g, '').trim();
          analysis = JSON.parse(cleanedText) as DamageAnalysis;
        } catch (e) {
          console.error("Failed to parse JSON from model response:", part.text, e);
          const jsonMatch = part.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              analysis = JSON.parse(jsonMatch[0]) as DamageAnalysis;
            } catch (e2) {
              console.error("Failed to parse extracted JSON from model response:", jsonMatch[0], e2);
            }
          }
        }
      }
    }
  }

  if (!annotatedImage || !analysis) {
    throw new Error('The AI model did not return the expected annotated image and analysis data. Please try again.');
  }

  return { annotatedImage, analysis };
}

/**
 * Generates a photorealistic preview of the repaired vehicle.
 * @param imageFile The image of the damaged vehicle.
 * @param description A user-provided description of the vehicle.
 * @returns A promise that resolves to a data URL for the repaired image.
 */
export async function generateRepairedPreview(imageFile: File, description: string): Promise<string> {
  const model = 'gemini-2.5-flash-image-preview';
  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = `
    You are an expert digital artist specializing in photorealistic vehicle restoration.
    Based on the provided image and description ("${description}"), your task is to generate a new image showing the vehicle fully repaired.
    - Restore it to a pristine, factory-new condition.
    - Remove all dents, scratches, cracks, and any other damage.
    - Ensure lighting, reflections, and textures are consistent with the original image for a realistic result.
    - Your main output must be the final, edited image. Do not add any text to the image itself.
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [imagePart, { text: prompt }],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  if (response.candidates && response.candidates.length > 0) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const { data, mimeType } = part.inlineData;
        return `data:${mimeType};base64,${data}`;
      }
    }
  }
  
  throw new Error('The AI model did not return a repaired image preview. Please try again.');
}