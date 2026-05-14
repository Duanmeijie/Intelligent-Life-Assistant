const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

router.get('/recommend-habits', auth, aiController.recommendHabits);
router.get('/analysis', auth, aiController.analysis);
router.get('/schedule-suggest', auth, aiController.scheduleSuggest);

module.exports = router;
