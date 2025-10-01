import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIService {
    private genAI: GoogleGenerativeAI;
    
    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateTrashTalk(region: 'bisaya' | 'tagalog', situation: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = region === 'bisaya' 
                ? `Generate a short Bisaya/Cebuano trash talk or taunt for a street fight. Situation: ${situation}. Keep it fun and  not offensive. Just 1-2 sentences.`
                : `Generate a short Tagalog trash talk or taunt for a street fight. Situation: ${situation}. Keep it fun and not offensive. Just 1-2 sentences.`;
            
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 100,
                    temperature: 0.9,
                },
            });

            return result.response.text() || "Laban lang!";
        } catch (error) {
            console.error("AI taunt generation failed:", error);
            return region === 'bisaya' ? "Kaya nimo na? Haha!" : "Kaya mo yan? Haha!";
        }
    }
}