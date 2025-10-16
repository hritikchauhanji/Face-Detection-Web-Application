import axiosInstance from "./axiosInstance";

// Register user
export const registerUser = async (data) => {
  return await axiosInstance.post("/auth/register", data);
};

// Login user
export const loginUser = async (data) => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data; // contains accessToken
};

// Logout user
export const logoutUser = async () => {
  await axiosInstance.post("/auth/logout");
};

// Refresh token
export const refreshToken = async () => {
  return await axiosInstance.post("/auth/refresh-token");
};
