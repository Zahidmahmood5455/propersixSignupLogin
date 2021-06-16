const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/number', authController.createNumber);
router.post('/token', authController.verifyToken);
router.post('/signup', authController.signup);
router.get('/activateAccount/:token', authController.activateUser);
router.post('/login', authController.login);

module.exports = router;