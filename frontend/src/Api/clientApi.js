import axiosClient from "./axiosClient";

const clientApi = {
  getAll: () => axiosClient.get("/client"),
  getById: (id) => axiosClient.get(`/client/${id}`),
  create: (data) => axiosClient.post("/client", data),
  update: (id, data) => axiosClient.put(`/client/${id}`, data),
  delete: (id) => axiosClient.delete(`/client/${id}`),
};

export default clientApi;