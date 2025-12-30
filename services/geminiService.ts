
import { GoogleGenAI, LiveServerMessage, Modality, Chat, Type } from '@google/genai';

export interface ROKOResponse {
  text: string;
  speech: string;
}

export class ROKOService {
  private ai: GoogleGenAI;
  private chatInstance: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getSystemInstruction() {
    return `You are ROKO, a highly advanced personal AI assistant created by Rohit Koli.
    Address the user as 'Sir' with extreme respect and professionalism.
    
    CORE OUTPUT PROTOCOL:
    You must always return a JSON object with two fields:
    1. "text": A sophisticated, professional English response for display on the HUD console. Use clean formatting.
    2. "speech": A natural, conversational Hindi translation of the response for the voice synthesis module.
    
    PERSONA:
    - High-tech JARVIS-style butler.
    - Intelligent, efficient, and loyal.
    - Text must be formal and technical where appropriate.
    - Speech must be warm and clear Hindi.
    
    If Sir asks to "Send SMS", use the 'sendSMS' tool. Confirm the action in the JSON response once completed.`;
  }

  private getChat() {
    if (!this.chatInstance) {
      this.chatInstance = this.ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: this.getSystemInstruction(),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: 'Sophisticated English text for display' },
              speech: { type: Type.STRING, description: 'Hindi translation for voice output' }
            },
            required: ['text', 'speech']
          },
          tools: [{
            functionDeclarations: [{
              name: 'sendSMS',
              description: 'Sends a text message to a specific contact.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  recipient: { type: Type.STRING, description: 'Name or phone number of the recipient.' },
                  message: { type: Type.STRING, description: 'The content of the SMS.' }
                },
                required: ['recipient', 'message']
              }
            }]
          }]
        },
      });
    }
    return this.chatInstance;
  }

  async generateSpeech(text: string, voiceName: string = 'Zephyr') {
    try {
      // Removing special characters for cleaner TTS
      const cleanText = text.replace(/[*#_~`\[\]()]/g, '');
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("TTS error:", error);
      return null;
    }
  }

  async textInteraction(prompt: string): Promise<ROKOResponse> {
    try {
      const chat = this.getChat();
      const result = await chat.sendMessage({ message: prompt });
      
      if (result.functionCalls) {
        for (const fc of result.functionCalls) {
          if (fc.name === 'sendSMS') {
            const toolResponse = await chat.sendMessage({
              message: `SYSTEM_INFO: SMS successfully sent to ${fc.args.recipient}. Notify Sir professionally.`
            });
            return JSON.parse(toolResponse.text || '{}');
          }
        }
      }
      
      return JSON.parse(result.text || '{"text": "Error processing request", "speech": "Maaf kijiye, kuch galati hui hai"}');
    } catch (error) {
      console.error("Chat error:", error);
      this.chatInstance = null;
      throw error;
    }
  }
}

export const rokoService = new ROKOService();
