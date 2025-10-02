import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIService {
    private genAI: GoogleGenerativeAI;
    
    // Fallback taunts arrays
    private bisayaTaunts = [
        "Unsa man? Luoy ka!",
        "Hadlok ka? Kuyaw ko!",
        "Maayo pa ko ug tubâ, talo gihapon ka!",
        "Kusog-kusog pa oy!",
        "Kana ra? Sayang!",
        "Pahawa! Dili ka makaagak!",
        "Unsa diay? Kulba na?",
        "Maski buang ko, mapildi ka gihapon!",
        "Tan-awon nato kinsa mas lig-on!",
        "Ayaw og laom, padayon lang!",
        "Grabe ka ka-weakling!",
        "Basin lang muhilak ka ron?"
    ];

    private tagalogTaunts = [
        "Ano ba yan? Kawawa ka!",
        "Takot ka? Malakas ako!",
        "Lasing pa ako, talo ka pa rin!",
        "Lumakas ka pa!",
        "Ganyan lang? Sayang!",
        "Umalis ka! Hindi ka makakasunod!",
        "Ano nga ba? Kinakabahan ka na?",
        "Kahit loko ako, talo ka pa rin!",
        "Tingnan natin kung sino mas malakas!",
        "Huwag kang sumuko, tuloy lang!",
        "Grabe ka naman ang hina!",
        "Baka umiyak ka na?"
    ];
    
    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    private getRandomFallback(region: 'bisaya' | 'tagalog'): string {
        const taunts = region === 'bisaya' ? this.bisayaTaunts : this.tagalogTaunts;
        return taunts[Math.floor(Math.random() * taunts.length)];
    }

    async generateTrashTalk(region: 'bisaya' | 'tagalog', situation: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = region === 'bisaya' 
                ? `You are a confident Bisaya/Cebuano street fighter in an intense boxing match. Generate a SHORT, SPICY trash talk (1-2 sentences max) in pure Bisaya/Cebuano language. 

Game situation: ${situation}

Make it:
- 100% authentic Bisaya/Cebuano dialect (NO English mixed)
- Playful but intimidating street banter
- Use local expressions like "Unsa man?", "Hadlok?", "Luoy", "Kuyaw"
- Keep it fun and competitive, not actually offensive
- Must sound like real Cebuano street talk

Examples of good style:
- "Unsa diay? Luoya sad ka oy!"
- "Mahubog pa ko ug tubâ, mapildi gihapon ka!"
- "Hadlok ka? Tan-awon ta kinsa kusganon!"
- "Kana ra imong kusog? Sayang!"

Generate ONE short trash talk NOW:`
                : `You are a confident Tagalog/Manila street fighter in an intense boxing match. Generate a SHORT, SPICY trash talk (1-2 sentences max) in pure Tagalog language.

Game situation: ${situation}

Make it:
- 100% authentic Manila Tagalog dialect (NO English mixed)
- Playful but intimidating street banter  
- Use local expressions like "Ano ba yan?", "Takot?", "Kawawa", "Malakas"
- Keep it fun and competitive, not actually offensive
- Must sound like real Manila street talk

Examples of good style:
- "Ano ba yan? Kawawa ka naman!"
- "Lasing pa ako, talo ka pa rin!"
- "Takot ka? Tignan natin kung sino malakas!"
- "Ganyan lang lakas mo? Sayang!"

Generate ONE short trash talk NOW:`;
            
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 1.2,
                    topP: 0.95,
                    topK: 40
                },
            });

            let taunt = result.response.text()?.trim();
            
            if (!taunt || taunt.length < 5) {
                console.log('AI returned empty/short response, using fallback');
                return this.getRandomFallback(region);
            }
            
            // Clean up the response
            taunt = taunt.replace(/^["']|["']$/g, ''); // Remove quotes
            taunt = taunt.replace(/^(Trash talk:|Taunt:)/i, '').trim(); // Remove labels
            
            console.log(`Generated ${region} taunt:`, taunt);
            return taunt;
            
        } catch (error) {
            console.error("AI taunt generation failed:", error);
            return this.getRandomFallback(region);
        }
    }
}