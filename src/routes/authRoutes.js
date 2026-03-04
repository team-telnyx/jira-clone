const express = require('express');
const rateLimit = require('express-rate-limit');
const authService = require('../services/authService');
const authMiddleware = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
  handleValidationErrors
} = require('../validators/authValidators');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const result = await authService.registerUser({ email, password, name });

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }
);

router.post(
  '/login',
  loginLimiter,
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser({ email, password });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }
);

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to get user data'
    });
  }
});

module.exports = router;
