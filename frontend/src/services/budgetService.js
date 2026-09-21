import api from './api';

export const budgetService = {
  async getBudget(month, year) {
    const response = await api.get('/budget', {
      params: { month, year }
    });
    return response.data;
  },

  async setBudget(budgetData) {
    const response = await api.post('/budget', budgetData);
    return response.data;
  },

  async updateBudget(id, budgetData) {
    const response = await api.put(`/budget/${id}`, budgetData);
    return response.data;
  },

  async getBudgetHistory() {
    const response = await api.get('/budget/history');
    return response.data;
  }
};
