const db = require('../../services/databaseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${username}`);
    
    // Get user from database
    const user = await db.findUserByUsername(username);
    if (!user) {
      // Create default admin if doesn't exist
      if (username === 'admin') {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const userID = `USER-${Date.now()}`;
        await db.addUser({
          UserID: userID,
          Username: 'admin',
          Password: hashedPassword,
          Role: 'Admin',
          Status: 'Active'
        });
        
        if (password !== 'admin123') {
          return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        console.log('[AUTH] Created default admin user');
      } else {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
    } else {
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.Password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
    }
    
    console.log(`[AUTH] User authenticated: ${username}`);
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: user ? user.UserID : `USER-ADMIN-${Date.now()}`,
        username: username,
        role: user ? user.Role : 'Admin'
      },
      'YOUR_SECRET_KEY'
    );
    
    console.log(`[AUTH] Login successful for ${username}`);
    res.status(200).json({ 
      token,
      user: {
        username: username,
        role: user ? user.Role : 'Admin'
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userID = `USER-${Date.now()}`;
    
    await db.addUser({ 
      UserID: userID,
      Username: username,
      Password: hashedPassword,
      Role: role || 'User',
      Status: 'Active'
    });
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await db.getUsers();
    const safeUsers = users.map(u => ({ 
      UserID: u.UserID,
      Username: u.Username, 
      Role: u.Role,
      Status: u.Status
    }));
    res.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('[USERS] Error getting users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add new user
const addUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    
    // Check if user exists
    const existingUser = await db.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password and add user
    const hashedPassword = await bcrypt.hash(password, 10);
    const userID = `USER-${Date.now()}`;
    
    await db.addUser({
      UserID: userID,
      Username: username,
      Password: hashedPassword,
      Role: role || 'User',
      Status: 'Active'
    });
    
    console.log(`[USERS] Added new user: ${username} (${role || 'User'})`);
    res.json({ success: true, message: 'User added successfully' });
  } catch (error) {
    console.error('[USERS] Error adding user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (username === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }
    
    const user = await db.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await db.deleteUser(user.UserID);
    console.log(`[USERS] Deleted user: ${username}`);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('[USERS] Error deleting user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { login, register, getUsers, addUser, deleteUser };