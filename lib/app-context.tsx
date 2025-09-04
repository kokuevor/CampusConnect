"use client";

import type React from "react";
import { createContext, useContext, useReducer, useEffect } from "react";

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  phoneNumber: string;
  phoneVerified: boolean;
  studentIdValidated: boolean;
  studentIdValidationScore?: number;
  verificationStatus: "pending_verification" | "verified" | "rejected";
  profileImage?: string;
  studentIdImage?: {
    url: string;
    publicId: string;
  };
  selfieImage?: {
    url: string;
    publicId: string;
  };
  rating: number;
  totalDeliveries: number;
  joinedDate: string;
}

export interface DeliveryRequest {
  id: string;
  userId: string;
  senderName: string;
  pickupLocation: {
    type: "campus" | "off-campus";
    campusLocation?: string;
    offCampusAddress?: string;
  };
  dropoffLocation: {
    type: "campus" | "off-campus";
    campusLocation?: string;
    offCampusAddress?: string;
  };
  itemDescription: string;
  itemSize: "Small" | "Medium" | "Large";
  priority: "normal" | "high" | "urgent";
  paymentAmount: number; // Payment in Ghana Cedi (GHC)
  pickupDate: string;
  pickupTime: string;
  contactInfo: string;
  specialInstructions: string;
  status: "pending" | "matched" | "in-transit" | "delivered" | "cancelled";
  createdAt: string;
}

export interface Trip {
  id: string;
  travelerId: string;
  travelerName: string;
  fromLocation: {
    type: "campus" | "off-campus";
    campusLocation?: string;
    offCampusAddress?: string;
  };
  toLocation: {
    type: "campus" | "off-campus";
    campusLocation?: string;
    offCampusAddress?: string;
  };
  departureTime: string;
  transportMethod: string;
  maxDeliveries: number;
  currentDeliveries: number;
  pricePerDelivery: number; // Price in Ghana Cedi (GHC)
  isRecurring: boolean;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  matchedRequests: string[];
}

export interface Connection {
  id: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  type: "delivery" | "trip";
  status: "pending" | "active" | "completed";
  deliveryId?: string;
  tripId?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: "text" | "system";
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: string;
  deliveryContext?: {
    deliveryId: string;
    itemDescription: string;
    status: string;
  };
  unreadCount: number;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment: string;
  deliveryId: string;
  deliveryItemDescription: string;
  type: "sender" | "traveler";
  createdAt: string;
}

interface AppState {
  user: User | null;
  deliveryRequests: DeliveryRequest[];
  trips: Trip[];
  connections: Connection[];
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  reviews: Review[];
  isAuthenticated: boolean;
}

type AppAction =
  | { type: "SET_USER"; payload: User }
  | { type: "LOGOUT" }
  | { type: "ADD_DELIVERY_REQUEST"; payload: DeliveryRequest }
  | { type: "SET_DELIVERY_REQUESTS"; payload: DeliveryRequest[] }
  | {
      type: "UPDATE_DELIVERY_REQUEST";
      payload: { id: string; updates: Partial<DeliveryRequest> };
    }
  | { type: "ADD_TRIP"; payload: Trip }
  | { type: "SET_TRIPS"; payload: Trip[] }
  | { type: "UPDATE_TRIP"; payload: { id: string; updates: Partial<Trip> } }
  | { type: "ADD_CONNECTION"; payload: Connection }
  | {
      type: "UPDATE_CONNECTION";
      payload: { id: string; updates: Partial<Connection> };
    }
  | {
      type: "ADD_MESSAGE";
      payload: { conversationId: string; message: Message };
    }
  | { type: "ADD_CONVERSATION"; payload: Conversation }
  | { type: "ADD_REVIEW"; payload: Review }
  | { type: "LOAD_DATA"; payload: Partial<AppState> };

const initialState: AppState = {
  user: null,
  deliveryRequests: [],
  trips: [],
  connections: [],
  conversations: [],
  messages: {},
  reviews: [],
  isAuthenticated: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, isAuthenticated: true };
    case "LOGOUT":
      return { ...initialState };
    case "ADD_DELIVERY_REQUEST":
      return {
        ...state,
        deliveryRequests: [...state.deliveryRequests, action.payload],
      };
    case "SET_DELIVERY_REQUESTS":
      return {
        ...state,
        deliveryRequests: action.payload,
      };
    case "UPDATE_DELIVERY_REQUEST":
      return {
        ...state,
        deliveryRequests: state.deliveryRequests.map((req) =>
          req.id === action.payload.id
            ? { ...req, ...action.payload.updates }
            : req
        ),
      };
    case "ADD_TRIP":
      return { ...state, trips: [...state.trips, action.payload] };
    case "SET_TRIPS":
      return { ...state, trips: action.payload };
    case "UPDATE_TRIP":
      return {
        ...state,
        trips: state.trips.map((trip) =>
          trip.id === action.payload.id
            ? { ...trip, ...action.payload.updates }
            : trip
        ),
      };
    case "ADD_CONNECTION":
      return { ...state, connections: [...state.connections, action.payload] };
    case "UPDATE_CONNECTION":
      return {
        ...state,
        connections: state.connections.map((conn) =>
          conn.id === action.payload.id
            ? { ...conn, ...action.payload.updates }
            : conn
        ),
      };
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: [
            ...(state.messages[action.payload.conversationId] || []),
            action.payload.message,
          ],
        },
      };
    case "ADD_CONVERSATION":
      return {
        ...state,
        conversations: [...state.conversations, action.payload],
      };
    case "ADD_REVIEW":
      return { ...state, reviews: [...state.reviews, action.payload] };
    case "LOAD_DATA":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("campusconnect-data");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: "LOAD_DATA", payload: parsedData });
      } catch (error) {
        console.error("Failed to load saved data:", error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    if (state.isAuthenticated) {
      localStorage.setItem("campusconnect-data", JSON.stringify(state));
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Utility functions
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
