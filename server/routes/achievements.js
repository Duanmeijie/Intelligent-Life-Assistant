const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { auth } = require('../middleware/auth');

router.get('/', auth, achievementController.list);
router.get('/user', auth, achievementController.userAchievements);

module.exports = router;
