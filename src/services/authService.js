const jwt = require('jsonwebtoken');
const xss = require('xss');
const User = require('../models/User');

const generateTokens = (userId, email) => {
  const token = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );

  return { token, refreshToken };
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return xss(input.trim());
};

const registerUser = async ({ email, password, name }) => {
  const sanitizedName = sanitizeInput(name);
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const user = new User({
    email: normalizedEmail,
    password,
    name: sanitizedName
  });

  await user.save();

  const { token, refreshToken } = generateTokens(user._id.toString(), user.email);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: user.toJSON(),
    token,
    refreshToken
  };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const { token, refreshToken } = generateTokens(user._id.toString(), user.email);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: user.toJSON(),
    token,
    refreshToken
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user.toJSON();
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  generateTokens
};
