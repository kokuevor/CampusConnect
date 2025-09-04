import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Authenticate the request
    const authPayload = await authenticateRequest(request);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by ID
    const user = await User.findById(authPayload.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data (without password)
    const userData = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      studentId: user.studentId,
      verificationStatus: user.verificationStatus,
      profileImage: user.profileImage,
      rating: user.rating,
      totalDeliveries: user.totalDeliveries,
      joinedDate: user.joinedDate.toISOString(),
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
