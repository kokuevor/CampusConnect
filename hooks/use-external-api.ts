import { useState, useCallback } from "react";
import { ExternalApiClient, ApiResponse } from "@/lib/external-api";
import { getExternalApiConfig } from "@/lib/external-api-config";

// Create a singleton instance with config
const apiClient = new ExternalApiClient(getExternalApiConfig().baseUrl);

export interface UseExternalApiState {
  loading: boolean;
  error: string | null;
  data: any | null;
}

export interface UseExternalApiReturn extends UseExternalApiState {
  execute: <T = any>(
    apiCall: () => Promise<ApiResponse<T>>
  ) => Promise<ApiResponse<T>>;
  reset: () => void;
  client: ExternalApiClient;
}

export function useExternalApi(): UseExternalApiReturn {
  const [state, setState] = useState<UseExternalApiState>({
    loading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async <T = any>(
      apiCall: () => Promise<ApiResponse<T>>
    ): Promise<ApiResponse<T>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall();

        if (response.success) {
          setState({
            loading: false,
            error: null,
            data: response.data,
          });
        } else {
          setState({
            loading: false,
            error: response.error || "Unknown error occurred",
            data: null,
          });
        }

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Network error";
        setState({
          loading: false,
          error: errorMessage,
          data: null,
        });

        return {
          success: false,
          error: errorMessage,
          status: 0,
        };
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
    client: apiClient,
  };
}

// Specific hooks for common operations
export function useExternalAuth() {
  const api = useExternalApi();

  const signin = useCallback(
    async (email: string, password: string) => {
      return api.execute(() => api.client.signin(email, password));
    },
    [api]
  );

  const signup = useCallback(
    async (userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      studentId: string;
      phoneNumber: string;
      studentIdImageFile?: File;
      selfieImageFile?: File;
    }) => {
      return api.execute(() =>
        api.client.signup(
          userData.firstName,
          userData.lastName,
          userData.email,
          userData.password,
          userData.studentId,
          userData.phoneNumber,
          userData.studentIdImageFile,
          userData.selfieImageFile
        )
      );
    },
    [api]
  );

  const logout = useCallback(async () => {
    return api.execute(() => api.client.logout());
  }, [api]);

  const getCurrentUser = useCallback(async () => {
    return api.execute(() => api.client.getCurrentUser());
  }, [api]);

  return {
    ...api,
    signin,
    signup,
    logout,
    getCurrentUser,
  };
}

export function useExternalTrips() {
  const api = useExternalApi();

  const getAllTrips = useCallback(
    async (filters?: {
      from?: string;
      to?: string;
      departureDate?: string;
      page?: number;
      limit?: number;
    }) => {
      return api.execute(() =>
        api.client.getAllTrips(
          filters?.from,
          filters?.to,
          filters?.departureDate,
          filters?.page,
          filters?.limit
        )
      );
    },
    [api]
  );

  const createTrip = useCallback(
    async (tripData: {
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
    }) => {
      return api.execute(() => api.client.createTrip(tripData));
    },
    [api]
  );

  const getUserTrips = useCallback(
    async (status: string) => {
      return api.execute(() => api.client.getUserTrips(status));
    },
    [api]
  );

  const updateTrip = useCallback(
    async (tripId: string, updates: any) => {
      return api.execute(() => api.client.updateTrip(tripId, updates));
    },
    [api]
  );

  const cancelTrip = useCallback(
    async (tripId: string) => {
      return api.execute(() => api.client.cancelTrip(tripId));
    },
    [api]
  );

  return {
    ...api,
    getAllTrips,
    createTrip,
    getUserTrips,
    updateTrip,
    cancelTrip,
  };
}

export function useExternalDeliveryRequests() {
  const api = useExternalApi();

  const getAvailableRequests = useCallback(async () => {
    return api.execute(() => api.client.getAvailableDeliveryRequests());
  }, [api]);

  const createDeliveryRequest = useCallback(
    async (requestData: {
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
    }) => {
      return api.execute(() => api.client.createDeliveryRequest(requestData));
    },
    [api]
  );

  const getUserRequests = useCallback(
    async (status: string) => {
      return api.execute(() => api.client.getUserDeliveryRequests(status));
    },
    [api]
  );

  const acceptRequest = useCallback(
    async (requestId: string, tripId: string) => {
      return api.execute(() =>
        api.client.acceptDeliveryRequest(requestId, tripId)
      );
    },
    [api]
  );

  const completeDelivery = useCallback(
    async (requestId: string, deliveryProof: string, notes: string) => {
      return api.execute(() =>
        api.client.completeDelivery(requestId, deliveryProof, notes)
      );
    },
    [api]
  );

  const cancelRequest = useCallback(
    async (requestId: string) => {
      return api.execute(() => api.client.cancelDeliveryRequest(requestId));
    },
    [api]
  );

  return {
    ...api,
    getAvailableRequests,
    createDeliveryRequest,
    getUserRequests,
    acceptRequest,
    completeDelivery,
    cancelRequest,
  };
}

export function useExternalMessages() {
  const api = useExternalApi();

  const sendMessage = useCallback(
    async (messageData: {
      conversationId: string;
      content: string;
      type: string;
    }) => {
      return api.execute(() => api.client.sendMessage(messageData));
    },
    [api]
  );

  const getConversations = useCallback(async () => {
    return api.execute(() => api.client.getUserConversations());
  }, [api]);

  const getMessages = useCallback(
    async (conversationId: string) => {
      return api.execute(() =>
        api.client.getConversationMessages(conversationId)
      );
    },
    [api]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      return api.execute(() => api.client.markMessagesAsRead(conversationId));
    },
    [api]
  );

  return {
    ...api,
    sendMessage,
    getConversations,
    getMessages,
    markAsRead,
  };
}

export function useExternalReviews() {
  const api = useExternalApi();

  const createReview = useCallback(
    async (reviewData: {
      revieweeId: string;
      deliveryId: string;
      rating: number;
      comment: string;
      type: string;
    }) => {
      return api.execute(() => api.client.createReview(reviewData));
    },
    [api]
  );

  const getReviewsForUser = useCallback(
    async (userId: string) => {
      return api.execute(() => api.client.getReviewsForUser(userId));
    },
    [api]
  );

  const getUserRatingStats = useCallback(
    async (userId: string) => {
      return api.execute(() => api.client.getUserRatingStats(userId));
    },
    [api]
  );

  return {
    ...api,
    createReview,
    getReviewsForUser,
    getUserRatingStats,
  };
}

// Export the singleton API client for direct access if needed
export { apiClient as externalApiClient };
