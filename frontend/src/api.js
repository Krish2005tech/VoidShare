import axios from "axios";

const API_URL = "http://localhost:7000/api"; // Backend URL

export const registerUser = async (username, password,key) => {
  try {
    const { data } = await axios.post(`${API_URL}/user/register`, {
      username,
      password,
      key
    });
    return data;
  } catch (error) {
    throw error.response?.data?.error || "Registration failed";
  }
};

export const loginUser = async (username, password) => {
  try {
    const { data } = await axios.post(`${API_URL}/user/login`, {
      username,
      password,
    });
    localStorage.setItem("token", data.token); // Store JWT token
    return data;
  } catch (error) {
    throw error.response?.data?.error || "Login failed";
  }
};

export const getOnlineUsers = async () => {
  try {
    const token = localStorage.getItem("token");
    const { data } = await axios.get(`${API_URL}/peer/allOnline`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) {
    throw error.response?.data?.error || "Failed to fetch online users";
  }
};
