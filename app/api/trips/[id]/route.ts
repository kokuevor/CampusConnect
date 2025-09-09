import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/lib/models/Trip";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Ensure User model is registered (fix for MissingSchemaError)
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

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    // Find the trip and verify ownership
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if the user owns this trip
    if (trip.travelerId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "You can only delete your own trips" },
        { status: 403 }
      );
    }

    // Delete the trip
    await Trip.findByIdAndDelete(tripId);

    return NextResponse.json({
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
}
