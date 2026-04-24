const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock-key');

class AICopyService {
    async generateOutreachEmail(business) {
        if (!process.env.GEMINI_API_KEY) {
            console.log('⚠️ GEMINI_API_KEY not configured - Using mock response');
            return this.getMockEmail(business);
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
        Write a cold outreach email to a business named "${business.name}" in the "${business.category}" industry.
        The business is located at "${business.address}".
        
        Context: We noticed they don't have a website.
        Goal: Sell them a web design service to build a professional website.
        Tone: Professional, helpful, and persuasive but not pushy.
        
        Key selling points:
        - Increase visibility
        - Get more customers
        - Professional online presence
        
        Keep it concise (under 200 words).
        Subject line included.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return {
                success: true,
                content: text,
                model: "gemini-2.0-flash"
            };
        } catch (error) {
            console.error('Error generating AI copy:', error);
            // Fallback to mock if API fails
            return this.getMockEmail(business);
        }
    }

    getMockEmail(business) {
        return {
            success: true,
            content: `Subject: Website for ${business.name}\n\nHi there,\n\nI noticed that ${business.name} doesn't have a website yet. In today's digital age, having an online presence is crucial for ${business.category} businesses to attract new customers.\n\nI help local businesses like yours build professional, affordable websites that drive results. I'd love to show you how we can help ${business.name} grow.\n\nAre you available for a quick chat this week?\n\nBest,\n[Your Name]`,
            model: "mock"
        };
    }
}

module.exports = new AICopyService();
