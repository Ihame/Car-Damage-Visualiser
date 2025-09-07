/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// NOTE: This API key is provided for demonstration purposes as per the user's request.
// In a production environment, this should be stored securely as an environment variable.
const ELEVENLABS_API_KEY = "sk_e831cecdaaf75dc30291a21b41dbc69b1e7cb7eca90eb0ef";
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // A default, high-quality voice (Rachel)
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

/**
 * Converts a string of text into speech using the ElevenLabs API.
 * @param text The text to be converted to speech.
 * @param language The language of the text ('en' or 'sw').
 * @returns A Promise that resolves to a URL for the generated audio.
 */
export async function textToSpeech(text: string, language: string): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API key is not configured.");
  }
  
  const headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": ELEVENLABS_API_KEY,
  };

  // Select the appropriate model based on the language
  const model_id = language === 'sw' ? 'eleven_multilingual_v2' : 'eleven_monolingual_v1';

  const body = JSON.stringify({
    text: text,
    model_id: model_id,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
    },
  });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`ElevenLabs API request failed: ${response.status} ${response.statusText} - ${errorBody.detail?.message || 'Unknown error'}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);

  } catch (error) {
    console.error("Error in textToSpeech service:", error);
    throw error;
  }
}
