import axiosInstance from "./axiosInstance";

export const registerUser = async (data) => {
  return await axiosInstance.post("/auth/register", data);
};

export const loginUser = async (data) => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data;
};

export const logoutUser = async () => {
  await axiosInstance.post("/auth/logout");
};

export const refreshToken = async () => {
  return await axiosInstance.post("/auth/refresh-token");
};
