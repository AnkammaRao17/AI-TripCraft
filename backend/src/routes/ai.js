const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all AI-related endpoints

router.post('/chat', aiController.chatAssistant);
router.get('/insights', aiController.getInsights);
router.post('/recommend', aiController.recommendDestinations);
router.get('/budget-tips', aiController.getBudgetTips);

module.exports = router;
