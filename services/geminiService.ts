/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import type { RepairCost } from '../types';

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const parseCostData = (text: string): RepairCost[] => {
    try {
        // Find the JSON block within the text, which might be wrapped in markdown backticks.
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        
        let jsonString: string;
        
        if (jsonMatch && jsonMatch[1]) {
            // If we found a markdown block, use its content.
            jsonString = jsonMatch[1];
        } else {
            // If no markdown block is found, assume the whole text is the JSON.
            // This is a fallback for cases where the model returns raw JSON.
            jsonString = text.trim();
        }

        const data = JSON.parse(jsonString);

        // Basic validation
        if (!Array.isArray(data)) {
            throw new Error("Parsed JSON is not an array.");
        }
        if (data.length > 0 && !data.every(item => 'part' in item && 'damage' in item && 'suggestion' in item && 'costUSD' in item && 'costRWF' in item)) {
            throw new Error("Parsed JSON does not match expected format.");
        }
        return data as RepairCost[];
    } catch (e) {
        console.error("Failed to parse cost data JSON:", e, "Raw text:", text);
        throw new Error(`The AI returned an invalid format for the cost estimation. Raw response: "${text}"`);
    }
}

const handleImageOnlyApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "repair"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};


/**
 * Generates an image with damage annotations and provides a cost estimate.
 * @param originalImage The original image file of the car.
 * @param userDescription The user's description of the damage.
 * @returns A promise that resolves to an object containing the annotated image data URL and the cost data.
 */
export const generateDamageAnalysis = async (
    originalImage: File,
    userDescription: string
): Promise<{ annotatedImage: string; costData: RepairCost[] }> => {
    console.log('Starting damage analysis generation...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert auto-body visual assistant.
Task: Analyze the uploaded car photo and user description. You MUST return two separate parts in your response: an edited image AND a JSON object.

1.  **Edited Image Part**:
    -   Take the uploaded car photo and create an EDITED IMAGE that overlays damage areas.
    -   Detect and highlight: dents, scratches, cracked lights, bumper or panel misalignment, chipped paint, rust.
    -   Add semi-transparent RED overlays only where damage likely exists. Keep everything else identical.
    -   Do NOT remove plates, beautify, or change the background. Keep scale, perspective, reflections, and lighting untouched.
    -   If a user description is provided, prioritize those areas. User description: "${userDescription || 'none'}"

2.  **JSON Text Part**:
    -   Provide a JSON array detailing the estimated repair costs for the damage you identified.
    -   Based on the severity of the damage, provide a 'suggestion' for each item, which must be either 'Repair' or 'Replace'.
    -   Base your cost estimates on standard US auto repair industry data.
    -   For RWF, use an approximate conversion rate of 1 USD = 1300 RWF.
    -   The JSON object must follow this exact schema:
    \`\`\`json
    [
      {
        "part": "string",
        "damage": "string",
        "suggestion": "string (either 'Repair' or 'Replace')",
        "costUSD": number,
        "costRWF": number
      }
    ]
    \`\`\`
    -   If no damage is detected, return an empty array [].

Return BOTH the edited image part and the text part containing only the JSON.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    // New response handling logic for multi-part responses
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
        const finishReason = response.candidates?.[0]?.finishReason;
        const reasonText = finishReason && finishReason !== 'STOP' ? `Reason: ${finishReason}.` : "The model's response was incomplete.";
        const textFeedback = response.text?.trim();
        const errorMessage = `The AI model did not return both an image and a cost estimate. ${reasonText} ${textFeedback ? `The model responded with: "${textFeedback}"` : ""}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    const imagePart = parts.find(part => part.inlineData);
    const textPartResponse = parts.find(part => part.text);

    if (!imagePart?.inlineData) {
        throw new Error("The AI model did not return an image for the annotation.");
    }
    if (!textPartResponse?.text) {
        throw new Error("The AI model did not return a cost estimate.");
    }

    const annotatedImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    const costData = parseCostData(textPartResponse.text);

    return { annotatedImage, costData };
};


/**
 * Generates a preview of the repaired car.
 * @param originalImage The original image file of the car.
 * @param userDescription The user's description of the damage to repair.
 * @returns A promise that resolves to the data URL of the repaired image.
 */
export const generateRepairedPreview = async (
    originalImage: File,
    userDescription: string
): Promise<string> => {
    console.log('Starting repaired preview generation...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert auto-body visual assistant.
Task: Create a “repaired” version of the SAME uploaded photo, using the user's description as a guide for what to fix.

User Description of Damage: "${userDescription || 'none'}"

Instructions:
- Remove scratches, fill dents, realign bumper/panels, restore paint to factory look, fix cracked lights based on the original image and user description.
- KEEP the same car model, color, reflections, background, camera angle, and lighting.
- Do not add stickers, text, watermarks, or color grading. 
- Do not invent new rims/parts; preserve all identity features.
- The repair should be subtle and realistic. No showroom gloss.

Return: ONLY the edited image (after-repair preview). Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    
    return handleImageOnlyApiResponse(response, 'repair');
};