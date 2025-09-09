"use client";

import { useState, useEffect } from "react";
import { useApp, generateId, formatDate } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  MapPin,
  Users,
  MessageCircle,
  Star,
  LogOut,
  Plus,
  Clock,
  CheckCircle,
  Truck,
  User,
  ArrowLeft,
  Car,
  Filter,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DeliveryRequestForm } from "@/components/delivery-request-form";
import { TripForm } from "@/components/trip-form";
import { ChatInterface } from "@/components/chat-interface";
import { ReviewForm } from "@/components/review-form";
import { ThemeSelector } from "@/components/theme-selector";
import { toast } from "@/hooks/use-toast";
import { ThemeIndicator } from "@/components/theme-indicator";

// Helper function to format location display
const formatLocation = (location: any) => {
  if (typeof location === "string") {
    return location; // Handle legacy string locations
  }
  if (location.type === "campus") {
    return location.campusLocation || "Unknown Campus Location";
  } else {
    return location.offCampusAddress || "Unknown Off-Campus Location";
  }
};

type TabType =
  | "requests"
  | "trips"
  | "feed"
  | "connections"
  | "messages"
  | "reviews";

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const router = useRouter();

  // Check if we're still loading from localStorage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Dashboard: Checking authentication...");
        console.log("Dashboard: Current state:", {
          isAuthenticated: state.isAuthenticated,
          user: state.user,
        });

        // If we already have user data in context, use it
        if (state.isAuthenticated && state.user) {
          console.log("Dashboard: User already authenticated in context");
          setIsLoading(false);
          return;
        }

        // Check if we have a token in cookies
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth-token="))
          ?.split("=")[1];

        if (!token) {
          console.log("Dashboard: No auth token found, redirecting to signin");
          router.push("/auth/signin");
          return;
        }

        // Verify token with API
        try {
          console.log("Dashboard: Verifying token with API...");
          const response = await fetch("/api/auth-test");
          console.log("Dashboard: /api/auth-test response:", response.status);

          if (response.ok) {
            const data = await response.json();
            console.log("Dashboard: Auth test data:", data);

            if (data.user) {
              dispatch({ type: "SET_USER", payload: data.user });
              setIsLoading(false);
            } else {
              console.log(
                "Dashboard: No user data in response, redirecting to signin"
              );
              router.push("/auth/signin");
            }
          } else {
            console.log("Dashboard: Auth test failed, redirecting to signin");
            router.push("/auth/signin");
          }
        } catch (error) {
          console.error("Dashboard: Auth test error:", error);
          router.push("/auth/signin");
        }
      } catch (error) {
        console.error("Dashboard: Auth check error:", error);
        router.push("/auth/signin");
      }
    };

    checkAuth();
  }, [dispatch, router, state.isAuthenticated, state.user]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch trips
      const tripsResponse = await fetch("/api/trips", {
        credentials: "include",
      });
      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json();
        dispatch({ type: "SET_TRIPS", payload: tripsData.trips || [] });
      } else {
        console.error("Failed to fetch trips:", tripsResponse.status);
      }

      // Fetch delivery requests
      const requestsResponse = await fetch("/api/delivery-requests", {
        credentials: "include",
      });
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        dispatch({
          type: "SET_DELIVERY_REQUESTS",
          payload: requestsData.requests || [],
        });
      } else {
        console.error(
          "Failed to fetch delivery requests:",
          requestsResponse.status
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated || !state.user) {
    return null; // Will redirect in useEffect
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("campusconnect-data");
      router.push("/auth/signin");
    }
  };

  const handleCreateRequest = async (requestData: any) => {
    try {
      const response = await fetch("/api/delivery-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create delivery request");
      }

      const result = await response.json();

      // Refresh data to get the latest from server
      await fetchData();

      setShowRequestForm(false);

      // Show success message
      toast({
        title: "✅ Delivery request created successfully!",
        description: "It's now visible in the feed for all users.",
      });
    } catch (error) {
      console.error("Error creating delivery request:", error);
      toast({
        title: "❌ Failed to create delivery request",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to check if locations are close or match
  const areLocationsCompatible = (tripLocation: any, requestLocation: any) => {
    // If both are campus locations, check if they're the same or close
    if (tripLocation.type === "campus" && requestLocation.type === "campus") {
      return tripLocation.campusLocation === requestLocation.campusLocation;
    }

    // If both are off-campus, check if addresses are similar (basic check)
    if (
      tripLocation.type === "off-campus" &&
      requestLocation.type === "off-campus"
    ) {
      const tripAddr = tripLocation.offCampusAddress?.toLowerCase() || "";
      const requestAddr = requestLocation.offCampusAddress?.toLowerCase() || "";
      return tripAddr.includes(requestAddr) || requestAddr.includes(tripAddr);
    }

    // Mixed campus/off-campus - could be compatible if off-campus is near campus
    return false;
  };

  // Enhanced function to check if a trip and request are compatible with flexible matching
  const checkTripRequestCompatibility = (trip: any, request: any) => {
    // Check if trip has available spots
    if (trip.currentDeliveries >= trip.maxDeliveries) {
      return false;
    }

    // Check if trip is active
    if (trip.status !== "active") {
      return false;
    }

    // Check if the user is not trying to match with themselves
    if (trip.travelerId === request.userId) {
      return false;
    }

    // Enhanced route compatibility check
    const pickupCompatible = areLocationsCompatible(
      trip.fromLocation,
      request.pickupLocation
    );
    const dropoffCompatible = areLocationsCompatible(
      trip.toLocation,
      request.dropoffLocation
    );

    // Perfect match: both pickup and dropoff match
    if (pickupCompatible && dropoffCompatible) {
      return true;
    }

    // Partial match: pickup matches (same starting point) - this allows for your example
    if (pickupCompatible) {
      return true;
    }

    // Route passes through: trip route includes request route
    const tripFrom =
      trip.fromLocation.campusLocation || trip.fromLocation.offCampusAddress;
    const tripTo =
      trip.toLocation.campusLocation || trip.toLocation.offCampusAddress;
    const requestFrom =
      request.pickupLocation.campusLocation ||
      request.pickupLocation.offCampusAddress;
    const requestTo =
      request.dropoffLocation.campusLocation ||
      request.dropoffLocation.offCampusAddress;

    // Check if trip route passes through request pickup or dropoff
    const routePassesThroughPickup =
      tripFrom === requestFrom || tripTo === requestFrom;
    const routePassesThroughDropoff =
      tripFrom === requestTo || tripTo === requestTo;

    return routePassesThroughPickup || routePassesThroughDropoff;
  };

  // Function to find compatible trips for a request
  const findCompatibleTrips = (request: any) => {
    return state.trips.filter((trip) =>
      checkTripRequestCompatibility(trip, request)
    );
  };

  // Function to find compatible requests for a trip
  const findCompatibleRequests = (trip: any) => {
    return state.deliveryRequests.filter((request) =>
      checkTripRequestCompatibility(trip, request)
    );
  };

  const handleCreateTrip = async (tripData: any) => {
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create trip");
      }

      const result = await response.json();

      // Refresh data to get the latest from server
      await fetchData();

      setShowTripForm(false);

      // Show success message
      toast({
        title: "✅ Trip posted successfully!",
        description: "It's now visible in the feed for all users.",
      });
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "❌ Failed to create trip",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenChat = (conversation: any) => {
    setActiveChat(conversation);
  };

  const handleCloseChat = () => {
    setActiveChat(null);
  };

  const handleSubmitReview = (reviewData: any) => {
    const newReview = {
      id: generateId(),
      reviewerId: state.user!.id,
      reviewerName: `${state.user!.firstName} ${state.user!.lastName}`,
      revieweeId: reviewData.revieweeId,
      revieweeName: reviewData.revieweeName,
      rating: reviewData.rating,
      comment: reviewData.comment,
      deliveryId: reviewData.deliveryId,
      deliveryItemDescription: reviewData.deliveryTitle,
      type: reviewData.type,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_REVIEW", payload: newReview });
    setShowReviewForm(null);
  };

  // Generate feed items with matches
  const generateFeedItems = () => {
    const items: any[] = [];

    // Add trips
    state.trips.forEach((trip) => {
      items.push({
        ...trip,
        type: "trip",
      });

      // Check for compatible requests and add match notifications
      const compatibleRequests = findCompatibleRequests(trip);
      if (compatibleRequests.length > 0) {
        items.push({
          id: `match-${trip.id}`,
          type: "match",
          trip,
          compatibleRequests,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Add delivery requests
    state.deliveryRequests.forEach((request) => {
      items.push({
        ...request,
        type: "request",
      });

      // Check for compatible trips and add match notifications
      const compatibleTrips = findCompatibleTrips(request);
      if (compatibleTrips.length > 0) {
        items.push({
          id: `match-${request.id}`,
          type: "match",
          request,
          compatibleTrips,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Sort by creation date (newest first)
    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const sidebarItems = [
    { id: "requests" as TabType, label: "My Requests", icon: Package },
    { id: "trips" as TabType, label: "My Trips", icon: MapPin },
    { id: "feed" as TabType, label: "Feed", icon: Package },
    { id: "connections" as TabType, label: "Connections", icon: Users },
    { id: "messages" as TabType, label: "Messages", icon: MessageCircle },
    { id: "reviews" as TabType, label: "Reviews", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Fixed Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <div className="bg-sidebar-primary rounded-lg p-2">
              <Truck className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-sidebar-foreground">
              CampusConnect
            </h1>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={
                        state.user.selfieImage?.url ||
                        "/diverse-student-profiles.png"
                      }
                      alt={`${state.user.firstName} ${state.user.lastName}`}
                    />
                    <AvatarFallback>
                      {state.user.firstName[0]}
                      {state.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium text-sidebar-foreground">
                      {state.user.firstName} {state.user.lastName}
                    </p>
                    <div className="flex items-center space-x-1">
                      <Badge
                        variant={
                          state.user.verificationStatus === "verified"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {state.user.verificationStatus === "verified"
                          ? "Verified"
                          : "Pending"}
                      </Badge>
                      <ThemeIndicator />
                    </div>
                  </div>
                </div>
                <User className="h-4 w-4 text-sidebar-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem className="flex items-center space-x-2">
                <ThemeSelector />
                <span>Theme Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowRequestForm(false);
                      setShowTripForm(false);
                      setActiveChat(null);
                      setShowReviewForm(null);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Developer Tools */}
        {process.env.NODE_ENV === "development" && (
          <div className="p-4 border-t border-sidebar-border">
            <Link href="/api-test">
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 mb-2"
              >
                <Settings className="h-5 w-5 mr-3" />
                API Test Interface
              </Button>
            </Link>
          </div>
        )}

        {/* Logout Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {activeChat ? (
            <ChatInterface conversation={activeChat} onBack={handleCloseChat} />
          ) : showReviewForm ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setShowReviewForm(null)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Reviews</span>
              </Button>
              <ReviewForm
                delivery={showReviewForm}
                onSubmit={handleSubmitReview}
                onCancel={() => setShowReviewForm(null)}
              />
            </div>
          ) : showRequestForm && activeTab === "requests" ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setShowRequestForm(false)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Requests</span>
              </Button>
              <DeliveryRequestForm
                onSubmit={handleCreateRequest}
                onCancel={() => setShowRequestForm(false)}
              />
            </div>
          ) : showTripForm && activeTab === "trips" ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setShowTripForm(false)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Trips</span>
              </Button>
              <TripForm
                onSubmit={handleCreateTrip}
                onCancel={() => setShowTripForm(false)}
              />
            </div>
          ) : (
            <>
              {activeTab === "requests" && (
                <MyRequestsContent
                  requests={state.deliveryRequests.filter(
                    (req) => req.userId === state.user!.id
                  )}
                  onCreateRequest={() => setShowRequestForm(true)}
                  onWriteReview={(delivery) => setShowReviewForm(delivery)}
                />
              )}
              {activeTab === "trips" && (
                <MyTripsContent
                  trips={state.trips.filter(
                    (trip) => trip.travelerId === state.user!.id
                  )}
                  onCreateTrip={() => setShowTripForm(true)}
                  onWriteReview={(delivery) => setShowReviewForm(delivery)}
                />
              )}
              {activeTab === "feed" && (
                <FeedContent
                  allRequests={state.deliveryRequests}
                  allTrips={state.trips}
                  currentUserId={state.user!.id}
                />
              )}
              {activeTab === "connections" && (
                <ConnectionsContent
                  connections={state.connections}
                  onOpenChat={handleOpenChat}
                />
              )}
              {activeTab === "messages" && (
                <MessagesContent
                  conversations={state.conversations}
                  onOpenChat={handleOpenChat}
                />
              )}
              {activeTab === "reviews" && (
                <ReviewsContent
                  reviews={state.reviews.filter(
                    (review) =>
                      review.revieweeId === state.user!.id ||
                      review.reviewerId === state.user!.id
                  )}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MyRequestsContent({
  requests,
  onCreateRequest,
  onWriteReview,
}: {
  requests: any[];
  onCreateRequest: () => void;
  onWriteReview: (delivery: any) => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "matched":
        return (
          <Badge className="bg-blue-500">
            <User className="h-3 w-3 mr-1" />
            Matched
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="text-xs">
            Urgent
          </Badge>
        );
      case "high":
        return <Badge className="bg-orange-500 text-xs">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 text-xs">Medium</Badge>;
      case "low":
        return (
          <Badge variant="secondary" className="text-xs">
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">My Requests</h2>
        <Button onClick={onCreateRequest}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No delivery requests yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first delivery request to get started
            </p>
            <Button onClick={onCreateRequest}>
              <Plus className="h-4 w-4 mr-2" />
              Create Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {request.itemDescription}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(request.priority)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>
                <CardDescription>
                  From {formatLocation(request.pickupLocation)} to{" "}
                  {formatLocation(request.dropoffLocation)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatDate(request.createdAt)}</span>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-primary">
                      GHC {request.paymentAmount}
                    </span>
                    {request.travelerName && (
                      <span>Traveler: {request.travelerName}</span>
                    )}
                    {request.status === "delivered" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onWriteReview({
                            id: request.id,
                            title: request.itemDescription,
                            from: request.pickupLocation,
                            to: request.dropoffLocation,
                            reward: `GHC ${request.paymentAmount}`,
                            deliverer: request.travelerName,
                            type: "delivery",
                          })
                        }
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Write Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MyTripsContent({
  trips,
  onCreateTrip,
  onWriteReview,
}: {
  trips: any[];
  onCreateTrip: () => void;
  onWriteReview: (delivery: any) => void;
}) {
  const getTransportIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "car":
        return <Car className="h-4 w-4" />;
      case "bicycle":
        return <MapPin className="h-4 w-4" />;
      case "walking":
        return <User className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">My Trips</h2>
        <Button onClick={onCreateTrip}>
          <Plus className="h-4 w-4 mr-2" />
          Post New Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No trips posted yet</h3>
            <p className="text-muted-foreground mb-4">
              Post your first trip to start earning from deliveries
            </p>
            <Button onClick={onCreateTrip}>
              <Plus className="h-4 w-4 mr-2" />
              Post Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <Card key={trip.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    {getTransportIcon(trip.transportMethod)}
                    <span>
                      {formatLocation(trip.fromLocation)} →{" "}
                      {formatLocation(trip.toLocation)}
                    </span>
                  </CardTitle>
                  <Badge
                    variant={
                      trip.status === "active"
                        ? "default"
                        : trip.status === "completed"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {trip.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center justify-between">
                  <span>{formatDate(trip.departureTime)}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {trip.transportMethod}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-muted-foreground">
                      {trip.currentDeliveries}/{trip.maxDeliveries} deliveries
                    </span>
                    <span className="text-muted-foreground">
                      GHC {trip.pricePerDelivery} each
                    </span>
                  </div>
                  <span className="font-medium text-primary">
                    GHC {trip.currentDeliveries * trip.pricePerDelivery}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectionsContent({
  connections,
  onOpenChat,
}: {
  connections: any[];
  onOpenChat: (conversation: any) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Connections</h2>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No connections yet</h3>
            <p className="text-muted-foreground">
              Connections will appear here when you match with other students
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="/diverse-student-profiles.png" />
                    <AvatarFallback>
                      {connection.otherUserName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">{connection.otherUserName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {connection.type} connection
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        connection.status === "active" ? "default" : "secondary"
                      }
                    >
                      {connection.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenChat(connection)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesContent({
  conversations,
  onOpenChat,
}: {
  conversations: any[];
  onOpenChat: (conversation: any) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Messages</h2>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-muted-foreground">
              Messages will appear here when you connect with other students
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => onOpenChat(conversation)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="/diverse-student-profiles.png" />
                    <AvatarFallback>
                      {conversation.participantNames[0]
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {conversation.participantNames[0]}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.deliveryContext && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {conversation.deliveryContext.itemDescription}
                        </span>
                      </div>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsContent({ reviews }: { reviews: any[] }) {
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filteredReviews = reviews.filter((review) => {
    if (filterType === "all") return true;
    return filterType === "received"
      ? review.revieweeId === review.revieweeId
      : review.reviewerId === review.reviewerId;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const receivedReviews = reviews.filter((r) => r.revieweeId === r.revieweeId);
  const averageRating =
    receivedReviews.length > 0
      ? receivedReviews.reduce((acc, r) => acc + r.rating, 0) /
        receivedReviews.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Reviews</h2>
        {averageRating > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= averageRating
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-medium">
              {averageRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">
              Reviews will appear here after completed deliveries
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {reviews.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Reviews
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {receivedReviews.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Reviews Received
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reviews.length - receivedReviews.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Reviews Given
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="given">Given</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {sortedReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">
                        From {review.reviewerName}
                      </h3>
                      <Badge variant="default">received</Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <CardDescription className="flex items-center justify-between">
                    <span>{formatDate(review.createdAt)}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {review.deliveryItemDescription}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FeedContent({
  allRequests,
  allTrips,
  currentUserId,
}: {
  allRequests: any[];
  allTrips: any[];
  currentUserId: string;
}) {
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Helper function to check if locations are compatible
  const areLocationsCompatible = (tripLocation: any, requestLocation: any) => {
    // If both are campus locations, check if they're the same or close
    if (tripLocation.type === "campus" && requestLocation.type === "campus") {
      return tripLocation.campusLocation === requestLocation.campusLocation;
    }

    // If both are off-campus, check if addresses are similar (basic check)
    if (
      tripLocation.type === "off-campus" &&
      requestLocation.type === "off-campus"
    ) {
      const tripAddr = tripLocation.offCampusAddress?.toLowerCase() || "";
      const requestAddr = requestLocation.offCampusAddress?.toLowerCase() || "";
      return tripAddr.includes(requestAddr) || requestAddr.includes(tripAddr);
    }

    // Mixed campus/off-campus - could be compatible if off-campus is near campus
    return false;
  };

  // Enhanced function to check if a trip and request are compatible with flexible matching
  const checkTripRequestCompatibility = (trip: any, request: any) => {
    // Check if trip has available spots
    if (trip.currentDeliveries >= trip.maxDeliveries) {
      return false;
    }

    // Check if trip is active
    if (trip.status !== "active") {
      return false;
    }

    // Check if the user is not trying to match with themselves
    if (trip.travelerId === request.userId) {
      return false;
    }

    // Enhanced route compatibility check
    const pickupCompatible = areLocationsCompatible(
      trip.fromLocation,
      request.pickupLocation
    );
    const dropoffCompatible = areLocationsCompatible(
      trip.toLocation,
      request.dropoffLocation
    );

    // Perfect match: both pickup and dropoff match
    if (pickupCompatible && dropoffCompatible) {
      return true;
    }

    // Partial match: pickup matches (same starting point) - this allows for your example
    if (pickupCompatible) {
      return true;
    }

    // Route passes through: trip route includes request route
    const tripFrom =
      trip.fromLocation.campusLocation || trip.fromLocation.offCampusAddress;
    const tripTo =
      trip.toLocation.campusLocation || trip.toLocation.offCampusAddress;
    const requestFrom =
      request.pickupLocation.campusLocation ||
      request.pickupLocation.offCampusAddress;
    const requestTo =
      request.dropoffLocation.campusLocation ||
      request.dropoffLocation.offCampusAddress;

    // Check if trip route passes through request pickup or dropoff
    const routePassesThroughPickup =
      tripFrom === requestFrom || tripTo === requestFrom;
    const routePassesThroughDropoff =
      tripFrom === requestTo || tripTo === requestTo;

    return routePassesThroughPickup || routePassesThroughDropoff;
  };

  // Show all active posts from all verified users (including current user's posts for testing)
  const activeRequests = allRequests.filter(
    (req) => req.status === "pending" || req.status === "matched"
  );
  const activeTrips = allTrips.filter((trip) => trip.status === "active");

  // Combine and filter feed items
  const feedItems = [
    ...activeRequests.map((req) => ({
      ...req,
      type: "request",
      isNew:
        new Date(req.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000, // Mark as new if created within last 24 hours
    })),
    ...activeTrips.map((trip) => ({
      ...trip,
      type: "trip",
      isNew:
        new Date(trip.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000, // Mark as new if created within last 24 hours
    })),
  ];

  // Add match notifications
  const matchItems: any[] = [];

  // Check for matches between trips and requests
  activeTrips.forEach((trip) => {
    const compatibleRequests = activeRequests.filter((request) => {
      // Check if trip has available spots
      if (trip.currentDeliveries >= trip.maxDeliveries) return false;

      // Check if the user is not trying to match with themselves
      if (trip.travelerId === request.userId) return false;

      // Check route compatibility
      const pickupCompatible = areLocationsCompatible(
        trip.fromLocation,
        request.pickupLocation
      );
      const dropoffCompatible = areLocationsCompatible(
        trip.toLocation,
        request.dropoffLocation
      );

      return pickupCompatible && dropoffCompatible;
    });

    if (compatibleRequests.length > 0) {
      matchItems.push({
        id: `match-${trip.id}`,
        type: "match",
        trip,
        compatibleRequests,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // Add route compatibility notifications for new trips
  activeTrips.forEach((trip) => {
    // Find all delivery requests that could benefit from this trip
    const potentialMatches = activeRequests.filter((request) => {
      // Don't match with own requests
      if (trip.travelerId === request.userId) return false;

      // Check if trip has available spots
      if (trip.currentDeliveries >= trip.maxDeliveries) return false;

      // Use enhanced compatibility check
      return checkTripRequestCompatibility(trip, request);
    });

    if (potentialMatches.length > 0) {
      matchItems.push({
        id: `route-notification-${trip.id}`,
        type: "route-notification",
        trip,
        potentialMatches,
        createdAt: new Date().toISOString(),
        notificationType: "new-trip-route-match",
      });
    }
  });

  // Add new delivery request notifications
  activeRequests.forEach((request) => {
    // Find all trips that could fulfill this request
    const compatibleTrips = activeTrips.filter((trip) => {
      // Don't match with own trips
      if (request.userId === trip.travelerId) return false;

      // Use enhanced compatibility check
      return checkTripRequestCompatibility(trip, request);
    });

    if (compatibleTrips.length > 0) {
      matchItems.push({
        id: `request-notification-${request.id}`,
        type: "request-notification",
        request,
        compatibleTrips,
        createdAt: new Date().toISOString(),
        notificationType: "new-request-route-match",
      });
    }
  });

  const allFeedItems = [...feedItems, ...matchItems];

  const filteredItems = allFeedItems.filter((item) => {
    if (filterType === "all") return true;
    if (filterType === "new") return item.isNew;
    return filterType === item.type;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "price-high":
        const aPrice =
          a.type === "request" ? a.paymentAmount : a.pricePerDelivery;
        const bPrice =
          b.type === "request" ? b.paymentAmount : b.pricePerDelivery;
        return bPrice - aPrice;
      case "price-low":
        const aPriceLow =
          a.type === "request" ? a.paymentAmount : a.pricePerDelivery;
        const bPriceLow =
          b.type === "request" ? b.paymentAmount : b.pricePerDelivery;
        return aPriceLow - bPriceLow;
      default:
        return 0;
    }
  });

  const getTransportIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "car":
        return <Car className="h-4 w-4" />;
      case "bicycle":
        return <MapPin className="h-4 w-4" />;
      case "walking":
        return <User className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="text-xs">
            Urgent
          </Badge>
        );
      case "high":
        return <Badge className="bg-orange-500 text-xs">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 text-xs">Medium</Badge>;
      case "low":
        return (
          <Badge variant="secondary" className="text-xs">
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Community Feed</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time notifications from all verified KNUST students
          </p>
        </div>
        <div className="text-sm text-muted-foreground text-right">
          <div className="font-medium">
            {activeRequests.length} delivery requests
            {feedItems.filter((item) => item.type === "request" && item.isNew)
              .length > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-bold">
                (
                {
                  feedItems.filter(
                    (item) => item.type === "request" && item.isNew
                  ).length
                }{" "}
                new)
              </span>
            )}
          </div>
          <div className="font-medium">
            {activeTrips.length} available trips
            {feedItems.filter((item) => item.type === "trip" && item.isNew)
              .length > 0 && (
              <span className="ml-2 text-green-600 dark:text-green-400 font-bold">
                (
                {
                  feedItems.filter((item) => item.type === "trip" && item.isNew)
                    .length
                }{" "}
                new)
              </span>
            )}
          </div>
        </div>
      </div>

      {feedItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No active posts yet
            </h3>
            <p className="text-muted-foreground">
              Check back later for delivery requests and trips from other
              students
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="request">Delivery Requests</SelectItem>
                  <SelectItem value="trip">Available Trips</SelectItem>
                  <SelectItem value="new">🆕 New Posts Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-high">Highest Price</SelectItem>
                <SelectItem value="price-low">Lowest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {sortedItems.map((item) => (
              <Card
                key={`${item.type}-${item.id}`}
                className={`hover:shadow-md transition-shadow ${
                  item.type === "route-notification"
                    ? "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20"
                    : item.type === "request-notification"
                    ? "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : item.isNew
                    ? "border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 shadow-lg"
                    : "border-l-4 border-l-blue-500"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/diverse-student-profiles.png" />
                        <AvatarFallback className="text-sm font-medium">
                          {item.type === "request"
                            ? (item.userName || "Unknown")
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                            : (item.travelerName || "Unknown")
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          {item.type === "request" ? (
                            <>
                              <Package className="h-5 w-5 text-blue-500" />
                              <span className="text-blue-600 dark:text-blue-400">
                                {item.itemDescription}
                              </span>
                            </>
                          ) : item.type === "route-notification" ? (
                            <>
                              <MapPin className="h-5 w-5 text-green-500" />
                              <span className="text-green-600 dark:text-green-400">
                                🚨 Route Match Alert: New Trip Available!
                              </span>
                            </>
                          ) : item.type === "request-notification" ? (
                            <>
                              <Package className="h-5 w-5 text-blue-500" />
                              <span className="text-blue-600 dark:text-blue-400">
                                📦 New Delivery Request Alert!
                              </span>
                            </>
                          ) : (
                            <>
                              {getTransportIcon(item.transportMethod)}
                              <span className="text-green-600 dark:text-green-400">
                                {formatLocation(item.fromLocation)} →{" "}
                                {formatLocation(item.toLocation)}
                              </span>
                            </>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {item.type === "route-notification" ? (
                            <>
                              <span className="font-medium text-green-700 dark:text-green-300">
                                New trip posted by{" "}
                                {item.trip.travelerName || "Unknown Traveler"}
                              </span>
                              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                Matches {item.potentialMatches.length} delivery
                                requests
                              </span>
                            </>
                          ) : item.type === "request-notification" ? (
                            <>
                              <span className="font-medium text-blue-700 dark:text-blue-300">
                                New delivery request by{" "}
                                {item.request.userName || "Unknown User"}
                              </span>
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                Matches {item.compatibleTrips.length} available
                                trips
                              </span>
                            </>
                          ) : (
                            <>
                              by{" "}
                              <span className="font-medium">
                                {item.type === "request"
                                  ? item.userName || "Unknown User"
                                  : item.travelerName || "Unknown Traveler"}
                              </span>
                              {item.type === "request" && (
                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                  Student ID: {item.userId}
                                </span>
                              )}
                              {item.type === "trip" && (
                                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                  Student ID: {item.travelerId}
                                </span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.type === "request" &&
                        getPriorityBadge(item.priority)}
                      {item.isNew && (
                        <Badge
                          variant="default"
                          className="text-xs bg-orange-500 text-white animate-pulse"
                        >
                          🆕 NEW
                        </Badge>
                      )}
                      <Badge
                        variant={
                          item.type === "route-notification"
                            ? "default"
                            : item.type === "request-notification"
                            ? "default"
                            : item.type === "request"
                            ? "default"
                            : "secondary"
                        }
                        className={`text-xs ${
                          item.type === "route-notification"
                            ? "bg-green-600 text-white"
                            : item.type === "request-notification"
                            ? "bg-blue-600 text-white"
                            : ""
                        }`}
                      >
                        {item.type === "request"
                          ? "📦 Delivery Request"
                          : item.type === "route-notification"
                          ? "🚨 Route Match Alert"
                          : item.type === "request-notification"
                          ? "📦 New Request Alert"
                          : "🚗 Trip Available"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {item.type === "route-notification" ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <div className="font-medium text-green-800 mb-2">
                            🚗 New Trip Route:{" "}
                            {formatLocation(item.trip.fromLocation)} →{" "}
                            {formatLocation(item.trip.toLocation)}
                          </div>
                          <div className="text-sm text-green-700">
                            <div>
                              🕐 Departure:{" "}
                              {formatDate(item.trip.departureTime)}
                            </div>
                            <div>🚗 Transport: {item.trip.transportMethod}</div>
                            <div>
                              👥 Available Spots:{" "}
                              {item.trip.maxDeliveries -
                                item.trip.currentDeliveries}
                              /{item.trip.maxDeliveries}
                            </div>
                            <div>
                              💰 Price: GHC {item.trip.pricePerDelivery} per
                              delivery
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-green-700">
                          <strong>📋 Compatible Delivery Requests:</strong>
                          <div className="mt-1 space-y-1">
                            {item.potentialMatches
                              .slice(0, 3)
                              .map((request: any, index: number) => (
                                <div
                                  key={index}
                                  className="text-xs bg-white p-2 rounded border"
                                >
                                  📦 {request.itemDescription} -{" "}
                                  {formatLocation(request.pickupLocation)} →{" "}
                                  {formatLocation(request.dropoffLocation)}
                                  <span className="ml-2 text-green-600 font-medium">
                                    GHC {request.paymentAmount}
                                  </span>
                                </div>
                              ))}
                            {item.potentialMatches.length > 3 && (
                              <div className="text-xs text-green-600 font-medium">
                                +{item.potentialMatches.length - 3} more
                                requests...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : item.type === "request-notification" ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <div className="font-medium text-blue-800 mb-2">
                            📦 New Delivery Request:{" "}
                            {item.request.itemDescription}
                          </div>
                          <div className="text-sm text-blue-700">
                            <div>
                              📍 Pickup:{" "}
                              {formatLocation(item.request.pickupLocation)}
                            </div>
                            <div>
                              🎯 Dropoff:{" "}
                              {formatLocation(item.request.dropoffLocation)}
                            </div>
                            <div>
                              ⏰ Pickup Date:{" "}
                              {formatDate(item.request.pickupDate)}
                            </div>
                            <div>
                              💰 Payment: GHC {item.request.paymentAmount}
                            </div>
                            <div>🚨 Priority: {item.request.priority}</div>
                          </div>
                        </div>
                        <div className="text-sm text-blue-700">
                          <strong>🚗 Compatible Available Trips:</strong>
                          <div className="mt-1 space-y-1">
                            {item.compatibleTrips
                              .slice(0, 3)
                              .map((trip: any, index: number) => (
                                <div
                                  key={index}
                                  className="text-xs bg-white p-2 rounded border"
                                >
                                  🚗 {formatLocation(trip.fromLocation)} →{" "}
                                  {formatLocation(trip.toLocation)} -{" "}
                                  {trip.transportMethod}
                                  <span className="ml-2 text-blue-600 font-medium">
                                    GHC {trip.pricePerDelivery}
                                  </span>
                                </div>
                              ))}
                            {item.compatibleTrips.length > 3 && (
                              <div className="text-xs text-blue-600 font-medium">
                                +{item.compatibleTrips.length - 3} more trips...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : item.type === "request" ? (
                      <div className="space-y-1">
                        <div>
                          📍 <strong>Pickup:</strong>{" "}
                          {formatLocation(item.pickupLocation)}
                        </div>
                        <div>
                          🎯 <strong>Dropoff:</strong>{" "}
                          {formatLocation(item.dropoffLocation)}
                        </div>
                        {item.pickupDate && (
                          <div>
                            ⏰ <strong>Pickup Date:</strong>{" "}
                            {formatDate(item.pickupDate)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div>
                          🕐 <strong>Departure:</strong>{" "}
                          {formatDate(item.departureTime)}
                        </div>
                        <div>
                          🚗 <strong>Transport:</strong> {item.transportMethod}
                        </div>
                        <div>
                          👥 <strong>Spots:</strong> {item.currentDeliveries}/
                          {item.maxDeliveries} filled
                        </div>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {item.type === "request" && item.itemDescription && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>📝 Item Description:</strong>{" "}
                        {item.itemDescription}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>📅 {formatDate(item.createdAt)}</span>
                      {item.type === "request" && item.pickupDate && (
                        <span>⏰ Pickup: {formatDate(item.pickupDate)}</span>
                      )}
                      {item.type === "trip" && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          🚗 {item.transportMethod}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {item.type === "route-notification" ? (
                        <>
                          <div className="text-right">
                            <span className="font-bold text-lg text-green-600">
                              GHC {item.trip.pricePerDelivery}
                            </span>
                            <span className="text-xs text-muted-foreground block">
                              per delivery
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            🚨 View Route Match
                          </Button>
                        </>
                      ) : item.type === "request-notification" ? (
                        <>
                          <div className="text-right">
                            <span className="font-bold text-lg text-blue-600">
                              GHC {item.request.paymentAmount}
                            </span>
                            <span className="text-xs text-muted-foreground block">
                              payment offered
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            📦 View Request Match
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="text-right">
                            <span className="font-bold text-lg text-green-600">
                              GHC{" "}
                              {item.type === "request"
                                ? item.paymentAmount
                                : item.pricePerDelivery}
                            </span>
                            {item.type === "trip" && (
                              <span className="text-xs text-muted-foreground block">
                                per delivery
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {item.type === "request"
                              ? "📦 Offer to Deliver"
                              : item.type === "match"
                              ? "🔗 View Matches"
                              : "🚗 Join Trip"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
