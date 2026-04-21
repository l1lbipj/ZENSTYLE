import axiosClient from './axiosClient';

const businessApi = {
  dashboardAdmin: () => axiosClient.get('/dashboard/admin'),
  dashboardStaff: () => axiosClient.get('/dashboard/staff'),
  dashboardClient: () => axiosClient.get('/dashboard/client'),
  staffSchedules: (params) => axiosClient.get('/staff/schedules', { params }),
  staffAppointments: (params) => axiosClient.get('/staff/appointments', { params }),
  staffAttendanceToday: () => axiosClient.get('/staff/attendance/today'),
  staffAttendanceHistory: (params) => axiosClient.get('/staff/attendance/history', { params }),
  staffCheckIn: (payload) => axiosClient.post('/staff/attendance/check-in', payload),
  staffCheckOut: (payload) => axiosClient.post('/staff/attendance/check-out', payload),

  appointments: (params) => axiosClient.get('/appointments', { params }),
  bookAppointment: (payload) => axiosClient.post('/appointments', payload),
  cancelAppointment: (id) => axiosClient.patch(`/appointments/${id}/cancel`),
  checkInAppointment: (id) => axiosClient.patch(`/appointments/${id}/check-in`),
  checkOutAppointment: (id) => axiosClient.patch(`/appointments/${id}/check-out`),
  rescheduleAppointment: (id, payload) => axiosClient.put(`/appointments/${id}/reschedule`, payload),
  completeTask: (detailId) => axiosClient.patch(`/appointment-details/${detailId}/complete`),

  myProfile: () => axiosClient.get('/profile/me'),
  updateMyProfile: (payload) => axiosClient.put('/profile/me', payload),
  allergyCatalog: () => axiosClient.get('/allergies'),
  clientHistory: (params) => axiosClient.get('/client/me/history', { params }),
  clientPreferences: () => axiosClient.get('/client/me/preferences'),
  updateClientPreferences: (payload) => axiosClient.put('/client/me/preferences', payload),

  feedbackList: (params) => axiosClient.get('/feedback', { params }),
  submitFeedback: (payload) => axiosClient.post('/feedback', payload),
  replyFeedback: (id, payload) => axiosClient.post(`/feedbacks/${id}/reply`, payload),
  replyFeedbackLegacy: (id, payload) => axiosClient.patch(`/feedback/${id}/reply`, payload),
  adminFeedbacks: () => axiosClient.get('/admin/feedbacks'),
  staffFeedbacks: () => axiosClient.get('/staff/feedbacks'),

  services: (params) => axiosClient.get('/management/services', { params }),
  createService: (payload) => axiosClient.post('/management/services', payload),
  updateService: (id, payload) => axiosClient.put(`/management/services/${id}`, payload),
  deleteService: (id) => axiosClient.delete(`/management/services/${id}`),

  promotions: (params) => axiosClient.get('/management/promotions', { params }),
  createPromotion: (payload) => axiosClient.post('/management/promotions', payload),
  updatePromotion: (id, payload) => axiosClient.put(`/management/promotions/${id}`, payload),
  deletePromotion: (id) => axiosClient.delete(`/management/promotions/${id}`),

  products: (params) => axiosClient.get('/management/products', { params }),
  createProduct: (payload) => axiosClient.post('/management/products', payload),
  updateProduct: (id, payload) => axiosClient.put(`/management/products/${id}`, payload),
  deleteProduct: (id) => axiosClient.delete(`/management/products/${id}`),

  suppliers: (params) => axiosClient.get('/management/suppliers', { params }),
  createSupplier: (payload) => axiosClient.post('/management/suppliers', payload),
  updateSupplier: (id, payload) => axiosClient.put(`/management/suppliers/${id}`, payload),
  deleteSupplier: (id) => axiosClient.delete(`/management/suppliers/${id}`),

  reports: () => axiosClient.get('/management/reports'),

  // Shop checkout (client)
  checkoutCart: (payload) => axiosClient.post('/shop/checkout', payload),
  myShopOrders: () => axiosClient.get('/shop/orders'),
  shopOrderDetail: (id) => axiosClient.get(`/shop/orders/${id}`),
  completeShopOrder: (id) => axiosClient.patch(`/shop/orders/${id}/complete`),
  notifications: () => axiosClient.get('/notifications'),
};

export default businessApi;
