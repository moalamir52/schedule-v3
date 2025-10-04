const { getUsers, updateUser, deleteUser } = require('../../services/googleSheetsService');

const getAllUsers = async (req, res) => {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    await updateUser(userId, { Role: role });
    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const changeUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await updateUser(userId, { 
      Password: hashedPassword,
      PlainPassword: newPassword
    });
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const defaultPassword = '123456';
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await updateUser(userId, { 
      Password: hashedPassword,
      PlainPassword: defaultPassword
    });
    res.status(200).json({ message: 'Password reset to default (123456)' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { findUserByUsername } = require('../../services/googleSheetsService');
    const bcrypt = require('bcryptjs');
    
    // Get user from token (you'll need to implement JWT middleware)
    // For now, we'll use username from request body
    const { username } = req.body;
    
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.Password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await updateUser(user.UserID, {
      Password: hashedNewPassword,
      PlainPassword: newPassword
    });
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing own password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    await deleteUser(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUserById, changeUserPassword, resetUserPassword, changeMyPassword };