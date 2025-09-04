import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/lib/models/Trip";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

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

    const body = await request.json();
    const {
      fromLocation,
      toLocation,
      departureDate,
      departureTime,
      availableSeats,
      pricePerDelivery,
      vehicleType,
      description,
      contactInfo,
    } = body;

    // Validate required fields
    if (
      !fromLocation ||
      !toLocation ||
      !departureDate ||
      !departureTime ||
      !availableSeats ||
      !pricePerDelivery
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate date format
    const departureDateTime = new Date(departureDate + "T" + departureTime);
    if (isNaN(departureDateTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid departure date/time format" },
        { status: 400 }
      );
    }

    // Create new trip
    const trip = new Trip({
      travelerId: decoded.userId,
      fromLocation,
      toLocation,
      departureTime: departureDateTime,
      transportMethod: vehicleType || "Car",
      maxDeliveries: parseInt(availableSeats),
      currentDeliveries: 0,
      pricePerDelivery: parseFloat(pricePerDelivery),
      isRecurring: false,
      status: "active",
      matchedRequests: [],
    });

    await trip.save();

    // Return the created trip
    const tripData = {
      id: trip._id.toString(),
      travelerId: trip.travelerId,
      fromLocation: trip.fromLocation,
      toLocation: trip.toLocation,
      departureTime: trip.departureTime.toISOString(),
      transportMethod: trip.transportMethod,
      maxDeliveries: trip.maxDeliveries,
      currentDeliveries: trip.currentDeliveries,
      pricePerDelivery: trip.pricePerDelivery,
      isRecurring: trip.isRecurring,
      status: trip.status,
      matchedRequests: trip.matchedRequests,
      createdAt: trip.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        message: "Trip posted successfully",
        trip: tripData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Post trip error:", error);
    return NextResponse.json({ error: "Failed to post trip" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    // Fetch trips with user information
    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("travelerId", "firstName lastName email studentId")
      .exec();

    const tripsData = trips.map((trip: any) => ({
      id: trip._id.toString(),
      travelerId: trip.travelerId._id
        ? trip.travelerId._id.toString()
        : trip.travelerId.toString(),
      travelerName:
        trip.travelerId.firstName && trip.travelerId.lastName
          ? `${trip.travelerId.firstName} ${trip.travelerId.lastName}`
          : "Unknown Traveler",
      fromLocation: trip.fromLocation,
      toLocation: trip.toLocation,
      departureTime: trip.departureTime.toISOString(),
      transportMethod: trip.transportMethod,
      maxDeliveries: trip.maxDeliveries,
      currentDeliveries: trip.currentDeliveries,
      pricePerDelivery: trip.pricePerDelivery,
      isRecurring: trip.isRecurring,
      status: trip.status,
      matchedRequests: trip.matchedRequests,
      createdAt: trip.createdAt.toISOString(),
    }));

    return NextResponse.json({
      trips: tripsData,
      total: tripsData.length,
    });
  } catch (error) {
    console.error("Get trips error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}
