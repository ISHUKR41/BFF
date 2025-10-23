// JWT-based API client for admin authentication
// This is for reference - your current frontend should work without changes

class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL =
      process.env.NODE_ENV === "development" ? "http://localhost:5000" : ""; // Use relative URLs in production

    // Load token from localStorage
    this.token = localStorage.getItem("admin_token");
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}/api${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add JWT token if available
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async login(username: string, password: string) {
    const response = await this.request("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem("admin_token", response.token);
    }

    return response;
  }

  async validateToken() {
    if (!this.token) return { valid: false };

    try {
      const response = await this.request("/admin/validate");
      return response;
    } catch (error) {
      this.logout();
      return { valid: false };
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem("admin_token");
  }

  // Tournament methods
  async getTournaments() {
    return this.request("/tournaments");
  }

  async getTournament(gameType: string, tournamentType: string) {
    return this.request(`/tournaments/${gameType}/${tournamentType}`);
  }

  async resetTournament(gameType: string, tournamentType: string) {
    return this.request("/tournaments/reset", {
      method: "POST",
      body: JSON.stringify({ gameType, tournamentType }),
    });
  }

  async updateQRCode(
    gameType: string,
    tournamentType: string,
    qrCodeUrl: string
  ) {
    return this.request(`/tournaments/${gameType}/${tournamentType}/qr`, {
      method: "PATCH",
      body: JSON.stringify({ qrCodeUrl }),
    });
  }

  // Registration methods
  async createRegistration(registrationData: any) {
    return this.request("/registrations", {
      method: "POST",
      body: JSON.stringify(registrationData),
    });
  }

  async getRegistrations(filters?: {
    gameType?: string;
    tournamentType?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.gameType) params.append("gameType", filters.gameType);
    if (filters?.tournamentType)
      params.append("tournamentType", filters.tournamentType);
    if (filters?.status) params.append("status", filters.status);

    const queryString = params.toString();
    return this.request(
      `/registrations${queryString ? `?${queryString}` : ""}`
    );
  }

  async getRegistration(id: string) {
    return this.request(`/registrations/${id}`);
  }

  async updateRegistrationStatus(
    id: string,
    status: "pending" | "approved" | "rejected"
  ) {
    return this.request(`/registrations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async searchRegistrations(query: string) {
    return this.request(`/registrations/search/${encodeURIComponent(query)}`);
  }

  async updateRegistrationDetails(id: string, updates: any) {
    return this.request(`/registrations/${id}/details`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async updateRegistrationNotes(id: string, notes: string) {
    return this.request(`/registrations/${id}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    });
  }

  async toggleRegistrationFlag(id: string) {
    return this.request(`/registrations/${id}/flag`, {
      method: "PATCH",
    });
  }

  async togglePaymentVerification(id: string) {
    return this.request(`/registrations/${id}/verify-payment`, {
      method: "PATCH",
    });
  }

  async deleteRegistration(id: string) {
    return this.request(`/registrations/${id}`, {
      method: "DELETE",
    });
  }

  // Bulk operations
  async bulkApprove(ids: string[]) {
    return this.request("/registrations/bulk/approve", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  async bulkReject(ids: string[]) {
    return this.request("/registrations/bulk/reject", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  async bulkDelete(ids: string[]) {
    return this.request("/registrations/bulk/delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  // Activity logs
  async getActivityLogs(limit?: number) {
    const params = limit ? `?limit=${limit}` : "";
    return this.request(`/activity-logs${params}`);
  }

  async getTargetActivityLogs(targetType: string, targetId: string) {
    return this.request(`/activity-logs/${targetType}/${targetId}`);
  }

  // Health check
  async healthCheck() {
    return this.request("/health");
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export the class for testing or custom instances
export default APIClient;
