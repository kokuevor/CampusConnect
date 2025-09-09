import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/lib/models/Trip";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tripId = params.id;
    const userId = decoded.userId;

    // Find the trip
    const trip = await Trip.findById(tripId).populate(
      "travelerId",
      "firstName lastName email"
    );

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if user is trying to join their own trip
    if (trip.travelerId._id.toString() === userId) {
      return NextResponse.json(
        { error: "You cannot join your own trip" },
        { status: 400 }
      );
    }

    // Check if trip is still active
    if (trip.status !== "active") {
      return NextResponse.json(
        { error: "This trip is no longer available" },
        { status: 400 }
      );
    }

    // Check if there's space available
    if (trip.currentDeliveries >= trip.maxDeliveries) {
      return NextResponse.json(
        { error: "This trip is already full" },
        { status: 400 }
      );
    }

    // Get user info for the response
    const user = await User.findById(userId).select("firstName lastName email");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // TODO: In a real implementation, you would:
    // 1. Create a "TripInterest" or "JoinRequest" model to track interest
    // 2. Notify the trip owner via push notification/email
    // 3. Allow the trip owner to accept/decline join requests
    // 4. Update the trip's passenger list when accepted

    // For now, we'll return a success message with trip details
    const response = {
      success: true,
      message: `Interest registered! We'll notify ${trip.travelerId.firstName} that you want to join their trip.`,
      tripDetails: {
        id: trip._id,
        fromLocation: trip.fromLocation,
        toLocation: trip.toLocation,
        departureTime: trip.departureTime,
        transportMethod: trip.transportMethod,
        ownerName: `${trip.travelerId.firstName} ${trip.travelerId.lastName}`,
        ownerEmail: trip.travelerId.email,
      },
      userDetails: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Join trip error:", error);
    return NextResponse.json({ error: "Failed to join trip" }, { status: 500 });
  }
}
