import axiosInstance from "./axiosInstance";

export const uploadImage = async (formData) => {
  return await axiosInstance.post("/face/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getHistory = async () => {
  return await axiosInstance.get("/face/history");
};

export const deleteImage = async (id) => {
  return await axiosInstance.delete(`/face/delete/${id}`);
};
