const db = require('../../services/databaseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`[AUTH] No security - allowing login for: ${username}`);
    
    // No authentication - allow any login
    const token = jwt.sign(
      { 
        userId: 'USER-TEMP', 
        username: username,
        role: 'Admin' 
      },
      'YOUR_SECRET_KEY'
    );
    
    console.log(`[AUTH] Login successful (no auth) for ${username}`);
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