"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useExternalAuth,
  useExternalTrips,
  useExternalDeliveryRequests,
  useExternalMessages,
  useExternalReviews,
  useExternalApi,
} from "@/hooks/use-external-api";
import { getExternalApiConfig } from "@/lib/external-api-config";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface TestResponse {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
}

export default function ApiTestPage() {
  const [activeTab, setActiveTab] = useState("auth");
  const [bearerToken, setBearerToken] = useState("");
  const [responses, setResponses] = useState<Record<string, TestResponse>>({});
  const config = getExternalApiConfig();

  // Hook instances
  const auth = useExternalAuth();
  const trips = useExternalTrips();
  const deliveryRequests = useExternalDeliveryRequests();
  const messages = useExternalMessages();
  const reviews = useExternalReviews();
  const healthApi = useExternalApi();

  // Load bearer token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("external-auth-token");
    if (token) {
      setBearerToken(token);
      auth.client.setAuthToken(token);
    }
  }, []);

  // Update token in client when bearerToken changes
  useEffect(() => {
    if (bearerToken) {
      auth.client.setAuthToken(bearerToken);
      localStorage.setItem("external-auth-token", bearerToken);
    }
  }, [bearerToken, auth.client]);

  const handleResponse = (key: string, response: any) => {
    setResponses((prev) => ({
      ...prev,
      [key]: {
        success: response.success,
        status: response.status,
        data: response.data,
        error: response.error,
      },
    }));
  };

  const ResponseDisplay = ({ responseKey }: { responseKey: string }) => {
    const response = responses[responseKey];
    if (!response) return null;

    return (
      <Alert
        className={`mt-4 ${
          response.success ? "border-green-500" : "border-red-500"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {response.success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <Badge variant={response.success ? "default" : "destructive"}>
            Status: {response.status}
          </Badge>
        </div>
        <AlertDescription>
          <pre className="whitespace-pre-wrap text-xs max-h-40 overflow-auto">
            {response.success
              ? JSON.stringify(response.data, null, 2)
              : response.error || "Unknown error"}
          </pre>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">
                External API Test Interface
              </h1>
              <p className="text-muted-foreground mt-1">
                Test external backend endpoints • Base URL: {config.baseUrl}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Badge variant="outline">
              {process.env.NODE_ENV === "development"
                ? "Development"
                : "Production"}
            </Badge>
          </div>
        </div>

        {/* Global Bearer Token Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Authentication Configuration
            </CardTitle>
            <CardDescription>
              Set your bearer token for authenticated requests (will be stored
              locally)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="bearerToken">Bearer Token</Label>
                <Input
                  id="bearerToken"
                  type="password"
                  placeholder="Enter your bearer token..."
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setBearerToken("");
                    localStorage.removeItem("external-auth-token");
                    auth.client.setAuthToken("");
                  }}
                  variant="outline"
                >
                  Clear Token
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Tests */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="utility">Utilities</TabsTrigger>
          </TabsList>

          {/* Authentication Tab */}
          <TabsContent value="auth" className="space-y-6">
            <AuthenticationTests
              auth={auth}
              onResponse={handleResponse}
              loading={auth.loading}
              ResponseDisplay={ResponseDisplay}
            />
          </TabsContent>

          {/* Trips Tab */}
          <TabsContent value="trips" className="space-y-6">
            <TripsTests
              trips={trips}
              onResponse={handleResponse}
              loading={trips.loading}
              ResponseDisplay={ResponseDisplay}
            />
          </TabsContent>

          {/* Delivery Requests Tab */}
          <TabsContent value="delivery" className="space-y-6">
            <DeliveryTests
              deliveryRequests={deliveryRequests}
              onResponse={handleResponse}
              loading={deliveryRequests.loading}
              ResponseDisplay={ResponseDisplay}
            />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <MessagesTests
              messages={messages}
              onResponse={handleResponse}
              loading={messages.loading}
              ResponseDisplay={ResponseDisplay}
            />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <ReviewsTests
              reviews={reviews}
              onResponse={handleResponse}
              loading={reviews.loading}
              ResponseDisplay={ResponseDisplay}
            />
          </TabsContent>

          {/* Utilities Tab */}
          <TabsContent value="utility" className="space-y-6">
            <UtilityTests
              healthApi={healthApi}
              onResponse={handleResponse}
              loading={healthApi.loading}
              ResponseDisplay={ResponseDisplay}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Authentication Tests Component
function AuthenticationTests({
  auth,
  onResponse,
  loading,
  ResponseDisplay,
}: any) {
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    studentId: "",
    phoneNumber: "",
  });
  const [verificationCode, setVerificationCode] = useState("");

  const testSignIn = async () => {
    const response = await auth.signin(signInData.email, signInData.password);
    onResponse("signin", response);
  };

  const testSignUp = async () => {
    const response = await auth.signup(signUpData);
    onResponse("signup", response);
  };

  const testGetCurrentUser = async () => {
    const response = await auth.getCurrentUser();
    onResponse("currentUser", response);
  };

  const testLogout = async () => {
    const response = await auth.logout();
    onResponse("logout", response);
  };

  const testVerifyPhone = async () => {
    const response = await auth.execute(() =>
      auth.client.verifyPhone(verificationCode)
    );
    onResponse("verifyPhone", response);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Sign In */}
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Test user authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={signInData.email}
              onChange={(e) =>
                setSignInData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={signInData.password}
              onChange={(e) =>
                setSignInData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="password"
            />
          </div>
          <Button onClick={testSignIn} disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Sign In
          </Button>
          <ResponseDisplay responseKey="signin" />
        </CardContent>
      </Card>

      {/* Current User */}
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
          <CardDescription>Get authenticated user info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testGetCurrentUser}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Get Current User
          </Button>
          <ResponseDisplay responseKey="currentUser" />
        </CardContent>
      </Card>

      {/* Sign Up */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a new user account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={signUpData.firstName}
                onChange={(e) =>
                  setSignUpData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder="John"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={signUpData.lastName}
                onChange={(e) =>
                  setSignUpData((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={signUpData.email}
                onChange={(e) =>
                  setSignUpData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john.doe@university.edu"
              />
            </div>
            <div>
              <Label>Student ID</Label>
              <Input
                value={signUpData.studentId}
                onChange={(e) =>
                  setSignUpData((prev) => ({
                    ...prev,
                    studentId: e.target.value,
                  }))
                }
                placeholder="123456789"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={signUpData.password}
                onChange={(e) =>
                  setSignUpData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="password"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={signUpData.phoneNumber}
                onChange={(e) =>
                  setSignUpData((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                placeholder="+233XXXXXXXXX"
              />
            </div>
          </div>
          <Button onClick={testSignUp} disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Sign Up
          </Button>
          <ResponseDisplay responseKey="signup" />
        </CardContent>
      </Card>

      {/* Phone Verification & Logout */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Verification</CardTitle>
          <CardDescription>Verify phone number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Verification Code</Label>
            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
            />
          </div>
          <Button
            onClick={testVerifyPhone}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Verify Phone
          </Button>
          <ResponseDisplay responseKey="verifyPhone" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logout</CardTitle>
          <CardDescription>Sign out current user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testLogout}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Logout
          </Button>
          <ResponseDisplay responseKey="logout" />
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder components for other tabs
function TripsTests({ trips, onResponse, loading, ResponseDisplay }: any) {
  const [tripData, setTripData] = useState({
    fromLocation: "",
    toLocation: "",
    departureDate: "",
    departureTime: "",
    availableSeats: 1,
    pricePerDelivery: 0,
    vehicleType: "Car",
    recurring: false,
    description: "",
    contactInfo: "",
  });

  const testGetAllTrips = async () => {
    const response = await trips.getAllTrips();
    onResponse("getAllTrips", response);
  };

  const testCreateTrip = async () => {
    const response = await trips.createTrip(tripData);
    onResponse("createTrip", response);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Get All Trips</CardTitle>
          <CardDescription>Fetch available trips</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={testGetAllTrips}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Get All Trips
          </Button>
          <ResponseDisplay responseKey="getAllTrips" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Trip</CardTitle>
          <CardDescription>Post a new trip</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>From Location</Label>
              <Input
                value={tripData.fromLocation}
                onChange={(e) =>
                  setTripData((prev) => ({
                    ...prev,
                    fromLocation: e.target.value,
                  }))
                }
                placeholder="Starting point"
              />
            </div>
            <div>
              <Label>To Location</Label>
              <Input
                value={tripData.toLocation}
                onChange={(e) =>
                  setTripData((prev) => ({
                    ...prev,
                    toLocation: e.target.value,
                  }))
                }
                placeholder="Destination"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Departure Date</Label>
              <Input
                type="date"
                value={tripData.departureDate}
                onChange={(e) =>
                  setTripData((prev) => ({
                    ...prev,
                    departureDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Departure Time</Label>
              <Input
                type="time"
                value={tripData.departureTime}
                onChange={(e) =>
                  setTripData((prev) => ({
                    ...prev,
                    departureTime: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <Button
            onClick={testCreateTrip}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Trip
          </Button>
          <ResponseDisplay responseKey="createTrip" />
        </CardContent>
      </Card>
    </div>
  );
}

function DeliveryTests({
  deliveryRequests,
  onResponse,
  loading,
  ResponseDisplay,
}: any) {
  const testGetRequests = async () => {
    const response = await deliveryRequests.getAvailableRequests();
    onResponse("getRequests", response);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Get Available Requests</CardTitle>
          <CardDescription>Fetch available delivery requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={testGetRequests}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Get Available Requests
          </Button>
          <ResponseDisplay responseKey="getRequests" />
        </CardContent>
      </Card>
    </div>
  );
}

function MessagesTests({
  messages,
  onResponse,
  loading,
  ResponseDisplay,
}: any) {
  const testGetConversations = async () => {
    const response = await messages.getConversations();
    onResponse("getConversations", response);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Get Conversations</CardTitle>
          <CardDescription>Fetch user conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={testGetConversations}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Get Conversations
          </Button>
          <ResponseDisplay responseKey="getConversations" />
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewsTests({ reviews, onResponse, loading, ResponseDisplay }: any) {
  const [userId, setUserId] = useState("");

  const testGetUserReviews = async () => {
    if (!userId) return;
    const response = await reviews.getReviewsForUser(userId);
    onResponse("getUserReviews", response);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Get User Reviews</CardTitle>
          <CardDescription>Fetch reviews for a user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>User ID</Label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
          <Button
            onClick={testGetUserReviews}
            disabled={loading || !userId}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Get User Reviews
          </Button>
          <ResponseDisplay responseKey="getUserReviews" />
        </CardContent>
      </Card>
    </div>
  );
}

function UtilityTests({
  healthApi,
  onResponse,
  loading,
  ResponseDisplay,
}: any) {
  const testHealth = async () => {
    const response = await healthApi.execute(() => healthApi.client.health());
    onResponse("health", response);
  };

  const testInfo = async () => {
    const response = await healthApi.execute(() => healthApi.client.info());
    onResponse("info", response);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Health Check</CardTitle>
          <CardDescription>Check API health status</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testHealth} disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Health
          </Button>
          <ResponseDisplay responseKey="health" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Info</CardTitle>
          <CardDescription>Get API information</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testInfo} disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Get API Info
          </Button>
          <ResponseDisplay responseKey="info" />
        </CardContent>
      </Card>
    </div>
  );
}
