const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { text, fail } = require('../utils/validation');

// Generate JWT token
const generateToken = (id, version = 0) => {
  return jwt.sign({ id, version }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const name = text(req.body.name, 'name', 100);
  const email = text(req.body.email, 'email', 254).toLowerCase();
  const password = req.body.password;
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) fail(400, 'Password must have at least 8 characters and at most 72 bytes');

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const email = text(req.body.email, 'email', 254).toLowerCase();
  const password = req.body.password;
  if (typeof password !== 'string' || Buffer.byteLength(password) > 72) fail(400, 'Invalid password');

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    token: generateToken(user._id, user.tokenVersion),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
    },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  const { name, email, phone, password, currentPassword } = req.body;

  if (name !== undefined) user.name = text(name, 'name', 100);
  if (email !== undefined) user.email = text(email, 'email', 254).toLowerCase();
  if (phone !== undefined) {
    if (typeof phone !== 'string' || (phone && !/^\d{10}$/.test(phone))) fail(400, 'Invalid phone');
    user.phone = phone;
  }

  // Change password
  if (password) {
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72 || typeof currentPassword !== 'string') fail(400, 'Invalid password; use at least 8 characters and at most 72 bytes');
    if (!currentPassword) {
      res.status(400);
      throw new Error('Please provide current password');
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }
    user.password = password;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
  }

  const updated = await user.save();

  res.json({
    success: true,
    token: generateToken(updated._id, updated.tokenVersion),
    user: {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      isAdmin: updated.isAdmin,
      phone: updated.phone,
      avatar: updated.avatar,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  res.json({ success: true });
});
module.exports = { register, login, getMe, updateProfile, logout };
