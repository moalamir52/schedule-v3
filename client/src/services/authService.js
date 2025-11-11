const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth`;
const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error('Login failed');
  }
  const data = await response.json();
  const token = data.token;
  localStorage.setItem('token', token);
  // Create user data from server response
  const userData = {
    username: data.user?.username || username,
    userId: data.user?.userId || 'WEB-USER',
    role: data.user?.role || 'User'
  };
  // Store user info for audit logging
  localStorage.setItem('userId', userData.userId);
  localStorage.setItem('userName', userData.username);
  localStorage.setItem('userRole', userData.role);
  return userData;
};
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
};
const register = async (username, password, role) => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, role }),
  });
  if (!response.ok) {
    throw new Error('Registration failed');
  }
  return await response.json();
};
const changeMyPassword = async (username, currentPassword, newPassword) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/change-my-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, currentPassword, newPassword }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }
  return await response.json();
};
const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('userName');
  const role = localStorage.getItem('userRole');
  if (!token) return null;
  return {
    username: username || 'User',
    userId: localStorage.getItem('userId') || 'WEB-USER',
    role: role || 'User'
  };
};
export default {
  login,
  register,
  logout,
  getCurrentUser,
  changeMyPassword,
};