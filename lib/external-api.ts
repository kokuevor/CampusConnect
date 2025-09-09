// External Backend API Client
// Converted from script.js to TypeScript for Next.js integration

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export interface AuthResponse {
  message: string;
  user?: any;
  token?: string;
}

export interface DeliveryRequest {
  pickupLocation: string;
  dropoffLocation: string;
  itemDescription: string;
  itemSize: string;
  priority: string;
  paymentAmount: number;
  pickupDate: string;
  pickupTime: string;
  contactInfo: string;
  specialInstructions: string;
}

export interface Trip {
  fromLocation: string;
  toLocation: string;
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  pricePerDelivery: number;
  vehicleType: string;
  recurring: boolean;
  description: string;
  contactInfo: string;
}

export interface Review {
  revieweeId: string;
  deliveryId: string;
  rating: number;
  comment: string;
  type: string;
}

export interface Message {
  conversationId: string;
  content: string;
  type: string;
}

export class ExternalApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    this.loadAuthToken();
  }

  private loadAuthToken(): void {
    if (typeof window !== "undefined") {
      this.authToken = localStorage.getItem("external-auth-token");
    }
  }

  private saveAuthToken(token: string): void {
    this.authToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("external-auth-token", token);
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private mergeHeaders(
    baseHeaders: Record<string, string> = {},
    authHeaders: Record<string, string> = {}
  ): Record<string, string> {
    return { ...baseHeaders, ...authHeaders };
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      console.log(
        `API Request: ${options.method || "GET"} ${url} - Status: ${
          response.status
        }`
      );

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok
          ? undefined
          : data.error || data.message || "Request failed",
        status: response.status,
      };
    } catch (error) {
      console.error(`API Request failed: ${url}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  // Authentication endpoints
  async logout(): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/auth/logout`;
    const headers = this.getAuthHeaders();

    const result = await this.makeRequest(url, {
      method: "POST",
      headers: headers,
    });

    if (result.success) {
      this.authToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("external-auth-token");
      }
    }

    return result;
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/auth/me`;
    const headers = this.getAuthHeaders();

    return this.makeRequest(url, {
      method: "GET",
      headers: headers,
    });
  }

  async resendVerificationCode(): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/auth/resend-verification`;
    const headers = this.getAuthHeaders();

    return this.makeRequest(url, {
      method: "POST",
      headers: headers,
    });
  }

  async signin(
    email: string,
    password: string
  ): Promise<ApiResponse<AuthResponse>> {
    const url = `${this.baseUrl}/auth/signin`;
    const headers = this.mergeHeaders(
      {
        "Content-Type": "application/json",
      },
      this.getAuthHeaders()
    );

    const body = { email, password };

    const result = await this.makeRequest<AuthResponse>(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (result.success && result.data?.token) {
      this.saveAuthToken(result.data.token);
    }

    return result;
  }

  async signup(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    studentId: string,
    phoneNumber: string,
    studentIdImageFile?: File,
    selfieImageFile?: File
  ): Promise<ApiResponse<AuthResponse>> {
    const url = `${this.baseUrl}/auth/signup`;
    const formData = new FormData();

    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("studentId", studentId);
    formData.append("phoneNumber", phoneNumber);

    if (studentIdImageFile) {
      formData.append("studentIdImage", studentIdImageFile);
    }
    if (selfieImageFile) {
      formData.append("selfieImage", selfieImageFile);
    }

    const headers = this.getAuthHeaders();

    const result = await this.makeRequest<AuthResponse>(url, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    if (result.success && result.data?.token) {
      this.saveAuthToken(result.data.token);
    }

    return result;
  }

  async verifyPhone(verificationCode: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/auth/verify-phone`;
    const headers = this.mergeHeaders(
      {
        "Content-Type": "application/json",
      },
      this.getAuthHeaders()
    );

    const body = { verificationCode };

    return this.makeRequest(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
  }

  // Delivery Request endpoints
  async getAvailableDeliveryRequests(): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/delivery-requests`;
    const headers = this.getAuthHeaders();

    return this.makeRequest(url, {
      method: "GET",
      headers: headers,
    });
  }

  async createDeliveryRequest(
    requestData: DeliveryRequest
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/delivery-requests`;
    const headers = this.mergeHeaders(
      {
        "Content-Type": "application/json",
      },
      this.getAuthHeaders()
    );

    return this.makeRequest(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestData),
    });
  }

  async getUserDeliveryRequests(status: string): Promise<ApiResponse<any>> {
    const url = `${
      this.baseUrl
    }/delivery-requests/my-requests?status=${encodeURIComponent(status)}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async getDeliveryRequestById(requestId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/delivery-requests/${requestId}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async cancelDeliveryRequest(requestId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/delivery-requests/${requestId}`;

    return this.makeRequest(url, {
      method: "DELETE",
    });
  }

  async acceptDeliveryRequest(
    requestId: string,
    tripId: string
  ): Promise<ApiResponse<any>> {
    const url = `${
      this.baseUrl
    }/delivery-requests/${requestId}/accept?tripId=${encodeURIComponent(
      tripId
    )}`;

    return this.makeRequest(url, {
      method: "POST",
    });
  }

  async completeDelivery(
    requestId: string,
    deliveryProof: string,
    notes: string
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/delivery-requests/${requestId}/complete`;
    const headers = { "Content-Type": "application/json" };
    const body = { deliveryProof, notes };

    return this.makeRequest(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(body),
    });
  }

  async markInTransit(requestId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/delivery-requests/${requestId}/in-transit`;

    return this.makeRequest(url, {
      method: "PUT",
    });
  }

  // Messages endpoints
  async sendMessage(messageData: Message): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/messages`;
    const headers = { "Content-Type": "application/json" };

    return this.makeRequest(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(messageData),
    });
  }

  async getUserConversations(): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/messages/conversations`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async getConversationMessages(
    conversationId: string
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/messages/conversations/${conversationId}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async markMessagesAsRead(conversationId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/messages/conversations/${conversationId}/read`;

    return this.makeRequest(url, {
      method: "PUT",
    });
  }

  async getUnreadMessageCount(
    conversationId: string
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/messages/conversations/${conversationId}/unread-count`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async sendDeliveryNotification(
    requesterId: string,
    travelerId: string,
    content: string
  ): Promise<ApiResponse<any>> {
    const url = `${
      this.baseUrl
    }/messages/delivery-notification?requesterId=${encodeURIComponent(
      requesterId
    )}&travelerId=${encodeURIComponent(
      travelerId
    )}&content=${encodeURIComponent(content)}`;

    return this.makeRequest(url, {
      method: "POST",
    });
  }

  async sendSystemMessage(
    conversationId: string,
    content: string
  ): Promise<ApiResponse<any>> {
    const url = `${
      this.baseUrl
    }/messages/system?conversationId=${encodeURIComponent(
      conversationId
    )}&content=${encodeURIComponent(content)}`;

    return this.makeRequest(url, {
      method: "POST",
    });
  }

  // Reviews endpoints
  async createReview(reviewData: Review): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/reviews`;
    const headers = { "Content-Type": "application/json" };

    return this.makeRequest(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(reviewData),
    });
  }

  async canUserReviewDelivery(
    userId: string,
    deliveryId: string
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/reviews/can-review?userId=${encodeURIComponent(
      userId
    )}&deliveryId=${encodeURIComponent(deliveryId)}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async getReviewsForDelivery(deliveryId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/reviews/delivery/${deliveryId}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async getReviewsForUser(userId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/reviews/user/${userId}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async getReviewsByUser(userId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/reviews/user/${userId}/given`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async getUserRatingStats(userId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/reviews/user/${userId}/rating`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async getReviewById(reviewId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/reviews/${reviewId}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  // Trips endpoints
  async getAllTrips(
    from?: string,
    to?: string,
    departureDate?: string,
    page?: number,
    limit?: number
  ): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (departureDate) params.append("departureDate", departureDate);
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const url = `${this.baseUrl}/trips?${params.toString()}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async createTrip(tripData: Trip): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/trips`;
    const headers = { "Content-Type": "application/json" };

    return this.makeRequest(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(tripData),
    });
  }

  async getUserTrips(status: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/trips/my-trips?status=${encodeURIComponent(
      status
    )}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async getTripById(tripId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/trips/${tripId}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async updateTrip(
    tripId: string,
    updates: Partial<Trip> & { status?: string }
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/trips/${tripId}`;
    const headers = { "Content-Type": "application/json" };

    return this.makeRequest(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(updates),
    });
  }

  async cancelTrip(tripId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/trips/${tripId}`;

    return this.makeRequest(url, {
      method: "DELETE",
    });
  }

  // Users endpoints
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/users/change-password`;
    const headers = { "Content-Type": "application/json" };
    const body = { currentPassword, newPassword };

    return this.makeRequest(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(body),
    });
  }

  async updateOnlineStatus(isOnline: boolean): Promise<ApiResponse<any>> {
    const url = `${
      this.baseUrl
    }/users/online-status?isOnline=${encodeURIComponent(isOnline)}`;

    return this.makeRequest(url, {
      method: "PUT",
    });
  }

  async updateUserProfile(
    firstName: string,
    lastName: string,
    phoneNumber: string,
    profileImage?: string
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/users/profile`;
    const headers = { "Content-Type": "application/json" };
    const body = { firstName, lastName, phoneNumber, profileImage };

    return this.makeRequest(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(body),
    });
  }

  async getUserProfile(userId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/users/${userId}`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  // Utility endpoints
  async health(): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/health`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async info(): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/info`;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  async uploadImage(folder: string, file: File): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/upload/image?folder=${encodeURIComponent(
      folder
    )}`;
    const formData = new FormData();
    formData.append("file", file);

    return this.makeRequest(url, {
      method: "POST",
      body: formData,
    });
  }

  async uploadBase64Image(imageData: any): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/upload/image/base64`;
    const headers = { "Content-Type": "application/json" };

    return this.makeRequest(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(imageData),
    });
  }

  async deleteImage(publicId: string): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}/upload/image/${publicId}`;

    return this.makeRequest(url, {
      method: "DELETE",
    });
  }

  // Utility method to set auth token manually
  setAuthToken(token: string): void {
    this.saveAuthToken(token);
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Set base URL
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  // Get base URL
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Create a singleton instance
export const externalApi = new ExternalApiClient();

// Export default instance
export default externalApi;
