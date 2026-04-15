import axiosClient from "./axiosClient";

const staffApi = {
  getAll: () => axiosClient.get("/staff"),
  getById: (id) => axiosClient.get(`/staff/${id}`),
  create: (data) => axiosClient.post("/staff", data),
  update: (id, data) => axiosClient.put(`/staff/${id}`, data),
  delete: (id) => axiosClient.delete(`/staff/${id}`),
};

export default staffApi;