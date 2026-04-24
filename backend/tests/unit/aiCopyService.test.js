const aiCopyService = require('../../src/services/aiCopyService');

// Mock the GoogleGenerativeAI library
jest.mock('@google/generative-ai', () => {
    const mockGenerateContent = jest.fn();
    const mockGetGenerativeModel = jest.fn(() => ({
        generateContent: mockGenerateContent
    }));

    return {
        GoogleGenerativeAI: jest.fn(() => ({
            getGenerativeModel: mockGetGenerativeModel
        }))
    };
});

describe('AICopyService', () => {
    const mockBusiness = {
        name: 'Test Business',
        category: 'Plumbing',
        address: '123 Test St'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-key';
    });

    it('should generate email using Gemini API when key is present', async () => {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const mockModel = new GoogleGenerativeAI().getGenerativeModel();

        mockModel.generateContent.mockResolvedValue({
            response: {
                text: () => 'Generated email content'
            }
        });

        const result = await aiCopyService.generateOutreachEmail(mockBusiness);

        expect(result.success).toBe(true);
        expect(result.content).toBe('Generated email content');
        expect(result.model).toBe('gemini-2.0-flash');
    });

    it('should fallback to mock email when API key is missing', async () => {
        delete process.env.GEMINI_API_KEY;

        const result = await aiCopyService.generateOutreachEmail(mockBusiness);

        expect(result.success).toBe(true);
        expect(result.model).toBe('mock');
        expect(result.content).toContain('Test Business');
    });

    it('should fallback to mock email when API call fails', async () => {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const mockModel = new GoogleGenerativeAI().getGenerativeModel();

        mockModel.generateContent.mockRejectedValue(new Error('API Error'));

        const result = await aiCopyService.generateOutreachEmail(mockBusiness);

        expect(result.success).toBe(true);
        expect(result.model).toBe('mock');
    });
});
