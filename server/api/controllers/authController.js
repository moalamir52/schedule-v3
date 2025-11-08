const db = require('../../services/databaseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`[AUTH] Login attempt: ${username}`);
    
    const user = await db.findUserByUsername(username);
    console.log(`[AUTH] User found:`, user ? 'YES' : 'NO');
    if (user) {
      console.log(`[AUTH] User status: ${user.Status}`);
      console.log(`[AUTH] User password exists: ${!!user.Password}`);
    }
    
    if (!user || user.Status !== 'Active') {
      console.log(`[AUTH] Login failed: User not found or inactive`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    console.log(`[AUTH] Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`[AUTH] Login failed: Invalid password`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        userId: user.UserID, 
        username: user.Username,
        role: user.Role 
      },
      'YOUR_SECRET_KEY'
    );
    
    console.log(`[AUTH] Login successful for ${username}`);
    res.status(200).json({ token });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const register = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body is required' });
    }
    
    const { username, password, role } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.addUser({ 
      username, 
      password: hashedPassword, 
      plainPassword: password,
      role 
    });
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, register };