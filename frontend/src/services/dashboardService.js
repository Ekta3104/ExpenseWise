import api from './api';

export const dashboardService = {
  async getDashboardData(month, year) {
    const response = await api.get('/dashboard', {
      params: { month, year }
    });
    return response.data;
  }
};
