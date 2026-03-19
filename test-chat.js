require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello',
      config: {
        systemInstruction: 'You are a test',
      }
    });
    console.log('Success:', response.text);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
