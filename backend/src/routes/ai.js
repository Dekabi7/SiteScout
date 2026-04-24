const express = require('express');
const router = express.Router();
const aiCopyService = require('../services/aiCopyService');
const { authenticateToken } = require('../middleware/auth');

// Generate copy for a business
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const { business } = req.body;

        if (!business || !business.name) {
            return res.status(400).json({ error: 'Business data required' });
        }

        // Check if user has credits/plan (optional, for now just allow it)
        // const user = req.user;

        const result = await aiCopyService.generateOutreachEmail(business);

        res.json(result);
    } catch (error) {
        console.error('Error in AI generation route:', error);
        res.status(500).json({ error: 'Failed to generate copy' });
    }
});

module.exports = router;
