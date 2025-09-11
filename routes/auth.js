const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, plan, firstName, lastName, phone, company, position, location, bio } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Generate username from email
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    // Ensure username is unique
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const hashed = await bcrypt.hash(password, 10);
    const userData = {
      username,
      email,
      password: hashed,
      plan: plan || 'Free',
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      company: company || '',
      position: position || '',
      location: location || '',
      bio: bio || ''
    };

    const user = await User.create(userData);
    res.status(201).json({
      message: 'User created',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  console.log('🔐 Signin attempt:', { email, password: password ? 'provided' : 'missing' });

  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const user = await User.findOne({ email: email });
    console.log('🔐 User found:', user ? 'yes' : 'no');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    console.log('🔐 Comparing password...');
    const match = await bcrypt.compare(password, user.password);
    console.log('🔐 Password match:', match);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    // Generate a real JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, plan: user.plan },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        plan: user.plan,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/validate
router.post('/validate', async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization.split(' ')[1];
  console.log("token", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    // Return the decoded user info (id, email, plan)
    res.json({ id: decoded.id, email: decoded.email, plan: decoded.plan });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// PUT /api/auth/update-profile
router.put('/update-profile', async (req, res) => {
  try {
    const { id, firstName, lastName, email, phone, company, position, location, bio, plan, preferences } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const updateData = {
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      phone: phone || '',
      company: company || '',
      position: position || '',
      location: location || '',
      bio: bio || '',
      plan: plan || 'Free',
      preferences: preferences || {}
    };

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        plan: user.plan,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        company: user.company,
        position: user.position,
        location: user.location,
        bio: user.bio,
        preferences: user.preferences
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
