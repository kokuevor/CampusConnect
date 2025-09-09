import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/lib/models/Trip";
import DeliveryRequest from "@/lib/models/DeliveryRequest";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

// Helper function to check if locations match or are compatible
function locationsMatch(location1: any, location2: any): boolean {
  if (location1.type !== location2.type) {
    return false;
  }

  if (location1.type === "campus") {
    return location1.campusLocation === location2.campusLocation;
  } else {
    // For off-campus locations, we could implement more sophisticated matching
    // For now, we'll do a simple string comparison
    return (
      location1.offCampusAddress
        ?.toLowerCase()
        .includes(location2.offCampusAddress?.toLowerCase()) ||
      location2.offCampusAddress
        ?.toLowerCase()
        .includes(location1.offCampusAddress?.toLowerCase())
    );
  }
}

// Helper function to calculate match score
function calculateMatchScore(trip: any, request: any): number {
  let score = 0;

  // Location matching (highest priority)
  if (locationsMatch(trip.fromLocation, request.pickupLocation)) score += 40;
  if (locationsMatch(trip.toLocation, request.dropoffLocation)) score += 40;

  // Time compatibility
  const tripDate = new Date(trip.departureTime);
  const requestDate = new Date(request.pickupDate);
  const timeDiff = Math.abs(tripDate.getTime() - requestDate.getTime());
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  if (hoursDiff <= 2) score += 15; // Same time window
  else if (hoursDiff <= 6) score += 10; // Within 6 hours
  else if (hoursDiff <= 24) score += 5; // Same day

  // Available capacity
  if (trip.currentDeliveries < trip.maxDeliveries) score += 5;

  return score;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Ensure User model is registered
    User;

    // Verify authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'my-trips', 'my-requests', or 'all'
    const minScore = parseInt(searchParams.get("minScore") || "50");

    let trips: any[] = [];
    let requests: any[] = [];

    if (type === "my-trips" || type === "all") {
      // Get active trips (either user's trips or all trips for matching)
      const tripQuery =
        type === "my-trips"
          ? { travelerId: userId, status: "active" }
          : { status: "active" };

      trips = await Trip.find(tripQuery)
        .populate("travelerId", "firstName lastName email studentId")
        .sort({ createdAt: -1 });
    }

    if (type === "my-requests" || type === "all") {
      // Get pending delivery requests
      const requestQuery =
        type === "my-requests"
          ? { userId: userId, status: "pending" }
          : { status: "pending" };

      requests = await DeliveryRequest.find(requestQuery)
        .populate("userId", "firstName lastName email studentId")
        .sort({ createdAt: -1 });
    }

    // Calculate matches
    const matches: any[] = [];

    if (type === "my-trips") {
      // Find delivery requests that match user's trips
      for (const trip of trips) {
        const availableRequests = await DeliveryRequest.find({
          status: "pending",
          userId: { $ne: userId }, // Exclude user's own requests
        }).populate("userId", "firstName lastName email studentId");

        for (const request of availableRequests) {
          const score = calculateMatchScore(trip, request);
          if (score >= minScore) {
            matches.push({
              type: "trip-request-match",
              score,
              trip: {
                id: trip._id,
                fromLocation: trip.fromLocation,
                toLocation: trip.toLocation,
                departureTime: trip.departureTime,
                transportMethod: trip.transportMethod,
                pricePerDelivery: trip.pricePerDelivery,
                maxDeliveries: trip.maxDeliveries,
                currentDeliveries: trip.currentDeliveries,
                traveler: trip.travelerId,
              },
              request: {
                id: request._id,
                itemDescription: request.itemDescription,
                itemSize: request.itemSize,
                pickupLocation: request.pickupLocation,
                dropoffLocation: request.dropoffLocation,
                paymentAmount: request.paymentAmount,
                pickupDate: request.pickupDate,
                pickupTime: request.pickupTime,
                priority: request.priority,
                requester: request.userId,
              },
            });
          }
        }
      }
    }

    if (type === "my-requests") {
      // Find trips that match user's delivery requests
      for (const request of requests) {
        const availableTrips = await Trip.find({
          status: "active",
          travelerId: { $ne: userId }, // Exclude user's own trips
          currentDeliveries: { $lt: Trip.schema.path("maxDeliveries") }, // Has available capacity
        }).populate("travelerId", "firstName lastName email studentId");

        for (const trip of availableTrips) {
          const score = calculateMatchScore(trip, request);
          if (score >= minScore) {
            matches.push({
              type: "request-trip-match",
              score,
              request: {
                id: request._id,
                itemDescription: request.itemDescription,
                itemSize: request.itemSize,
                pickupLocation: request.pickupLocation,
                dropoffLocation: request.dropoffLocation,
                paymentAmount: request.paymentAmount,
                pickupDate: request.pickupDate,
                pickupTime: request.pickupTime,
                priority: request.priority,
                requester: request.userId,
              },
              trip: {
                id: trip._id,
                fromLocation: trip.fromLocation,
                toLocation: trip.toLocation,
                departureTime: trip.departureTime,
                transportMethod: trip.transportMethod,
                pricePerDelivery: trip.pricePerDelivery,
                maxDeliveries: trip.maxDeliveries,
                currentDeliveries: trip.currentDeliveries,
                traveler: trip.travelerId,
              },
            });
          }
        }
      }
    }

    // Sort matches by score (highest first)
    matches.sort((a, b) => b.score - a.score);

    const response = {
      success: true,
      matches,
      totalMatches: matches.length,
      filters: {
        type,
        minScore,
        userId,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
