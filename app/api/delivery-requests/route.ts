import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import DeliveryRequest from "@/lib/models/DeliveryRequest";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";
import { KNUST_CAMPUS_LOCATIONS } from "@/lib/types/trip";

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
      pickupLocation,
      dropoffLocation,
      itemDescription,
      itemSize,
      priority,
      paymentAmount,
      pickupDate,
      pickupTime,
      contactInfo,
      specialInstructions,
    } = body;

    // Validate required fields
    if (
      !pickupLocation ||
      !dropoffLocation ||
      !itemDescription ||
      !itemSize ||
      !paymentAmount ||
      !pickupDate
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate location structures
    if (
      !pickupLocation ||
      typeof pickupLocation !== "object" ||
      !pickupLocation.type
    ) {
      return NextResponse.json(
        { error: "Invalid pickup location structure" },
        { status: 400 }
      );
    }

    if (
      !dropoffLocation ||
      typeof dropoffLocation !== "object" ||
      !dropoffLocation.type
    ) {
      return NextResponse.json(
        { error: "Invalid dropoff location structure" },
        { status: 400 }
      );
    }

    // Validate location types
    if (!["campus", "off-campus"].includes(pickupLocation.type)) {
      return NextResponse.json(
        { error: "Invalid pickup location type" },
        { status: 400 }
      );
    }

    if (!["campus", "off-campus"].includes(dropoffLocation.type)) {
      return NextResponse.json(
        { error: "Invalid dropoff location type" },
        { status: 400 }
      );
    }

    // Validate campus locations if type is campus
    if (pickupLocation.type === "campus" && !pickupLocation.campusLocation) {
      return NextResponse.json(
        { error: "Campus location is required for campus pickup" },
        { status: 400 }
      );
    }

    if (dropoffLocation.type === "campus" && !dropoffLocation.campusLocation) {
      return NextResponse.json(
        { error: "Campus location is required for campus dropoff" },
        { status: 400 }
      );
    }

    // Validate off-campus addresses if type is off-campus
    if (
      pickupLocation.type === "off-campus" &&
      !pickupLocation.offCampusAddress
    ) {
      return NextResponse.json(
        { error: "Off-campus address is required for off-campus pickup" },
        { status: 400 }
      );
    }

    if (
      dropoffLocation.type === "off-campus" &&
      !dropoffLocation.offCampusAddress
    ) {
      return NextResponse.json(
        { error: "Off-campus address is required for off-campus dropoff" },
        { status: 400 }
      );
    }

    // Validate date format
    const pickupDateObj = new Date(pickupDate);
    if (isNaN(pickupDateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid pickup date format" },
        { status: 400 }
      );
    }

    // Validate userId is a valid ObjectId
    if (!decoded.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Create new delivery request
    const deliveryRequest = new DeliveryRequest({
      userId: decoded.userId,
      pickupLocation,
      dropoffLocation,
      itemDescription,
      itemSize,
      priority: priority || "normal",
      paymentAmount: parseFloat(paymentAmount),
      pickupDate: pickupDateObj,
      pickupTime: pickupTime || "",
      contactInfo: contactInfo || "",
      specialInstructions: specialInstructions || "",
      status: "pending",
    });

    await deliveryRequest.save();

    // Return the created delivery request
    const requestData = {
      id: (deliveryRequest._id as any).toString(),
      userId: deliveryRequest.userId,
      pickupLocation: deliveryRequest.pickupLocation,
      dropoffLocation: deliveryRequest.dropoffLocation,
      itemDescription: deliveryRequest.itemDescription,
      itemSize: deliveryRequest.itemSize,
      priority: deliveryRequest.priority,
      paymentAmount: deliveryRequest.paymentAmount,
      pickupDate: deliveryRequest.pickupDate.toISOString(),
      pickupTime: deliveryRequest.pickupTime,
      contactInfo: deliveryRequest.contactInfo,
      specialInstructions: deliveryRequest.specialInstructions,
      status: deliveryRequest.status,
      createdAt: deliveryRequest.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        message: "Delivery request created successfully",
        request: requestData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create delivery request error:", error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // If it's a Mongoose validation error, log the specific validation errors
    if (error && typeof error === "object" && "errors" in error) {
      console.error(
        "Validation errors:",
        JSON.stringify(error.errors, null, 2)
      );
    }

    return NextResponse.json(
      { error: "Failed to create delivery request" },
      { status: 500 }
    );
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

    // Fetch delivery requests with user information
    const requests = await DeliveryRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "firstName lastName email studentId")
      .lean();

    const requestsData = requests.map((request: any) => ({
      id: request._id.toString(),
      userId: request.userId._id
        ? request.userId._id.toString()
        : request.userId.toString(),
      userName:
        request.userId.firstName && request.userId.lastName
          ? `${request.userId.firstName} ${request.userId.lastName}`
          : "Unknown User",
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      itemDescription: request.itemDescription,
      itemSize: request.itemSize,
      priority: request.priority,
      paymentAmount: request.paymentAmount,
      pickupDate: request.pickupDate.toISOString(),
      pickupTime: request.pickupTime,
      contactInfo: request.contactInfo,
      specialInstructions: request.specialInstructions,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    }));

    return NextResponse.json({
      requests: requestsData,
      total: requestsData.length,
    });
  } catch (error) {
    console.error("Get delivery requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery requests" },
      { status: 500 }
    );
  }
}
