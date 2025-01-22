import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
});

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post('/login', { email, password });
    return response.data.token;
  } catch (error) {
    throw new Error('Invalid credentials');
  }
};

export const registerUser = async (email: string, password: string) => {
  try {
    await api.post('/register', { email, password });
  } catch (error) {
    throw new Error('Registration failed');
  }
};

export const getUserDetails = async (token: string) => {
  try {
    const response = await api.get('/getuser', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch user details');
  }
};
