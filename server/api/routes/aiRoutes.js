const express = require('express');
const router = express.Router();
const aiService = require('../../services/aiService');

// AI Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { question, businessData } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const response = await aiService.askQuestion(question, businessData || {});
    
    res.json({ 
      success: true, 
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get AI response' 
    });
  }
});

module.exports = router;