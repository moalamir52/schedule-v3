const API_BASE_URL = 'http://localhost:5000/api/auth';

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

  const { token } = await response.json();
  localStorage.setItem('token', token);
  
  // Decode token to get user data
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload;
};

const logout = () => {
  localStorage.removeItem('token');
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
  const response = await fetch('http://localhost:5000/api/users/change-my-password', {
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
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    return null;
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  changeMyPassword,
};