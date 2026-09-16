const API_BASE = "http://localhost:5000/api";

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export const api = {
  health: () => request("/health"),

  getDashboard: () => request("/dashboard"),

  getHabits: (search = "", archived = false) =>
    request(
      `/habits?search=${encodeURIComponent(search)}&archived=${archived}`
    ),

  createHabit: (habit) =>
    request("/habits", {
      method: "POST",
      body: JSON.stringify(habit)
    }),

  updateHabit: (id, habit) =>
    request(`/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(habit)
    }),

  archiveHabit: (id) =>
    request(`/habits/${id}`, {
      method: "DELETE"
    }),

  restoreHabit: (id) =>
    request(`/habits/${id}/restore`, {
      method: "PATCH"
    }),

  completeHabit: (id, date) =>
    request(`/habits/${id}/completions`, {
      method: "POST",
      body: JSON.stringify({ date })
    }),

  undoCompletion: (id, date) =>
    request(`/habits/${id}/completions/${date}`, {
      method: "DELETE"
    }),

  getHistory: (id, days = 75) =>
    request(`/habits/${id}/history?days=${days}`)
};
