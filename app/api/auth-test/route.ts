import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Auth test: Starting...");

    // Test environment variables
    console.log("Auth test: Environment check", {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDbUri: !!process.env.DB_URI,
      nodeEnv: process.env.NODE_ENV,
    });

    // Test database connection
    try {
      await dbConnect();
      console.log("Auth test: Database connected successfully");
    } catch (dbError) {
      console.error("Auth test: Database connection failed:", dbError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Test authentication
    const authPayload = await authenticateRequest(request);
    console.log("Auth test: Auth payload:", authPayload);

    if (authPayload) {
      // Test user lookup
      const user = await User.findById(authPayload.userId);
      console.log("Auth test: User found:", !!user);

      if (user) {
        return NextResponse.json({
          message: "Authentication working",
          user: {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            studentId: user.studentId,
            phoneNumber: user.phoneNumber,
            phoneVerified: user.phoneVerified,
            studentIdValidated: user.studentIdValidated,
            studentIdValidationScore: user.studentIdValidationScore,
            verificationStatus: user.verificationStatus,
            profileImage: user.profileImage,
            studentIdImage: user.studentIdImage,
            selfieImage: user.selfieImage,
            rating: user.rating,
            totalDeliveries: user.totalDeliveries,
            joinedDate: user.joinedDate.toISOString(),
          },
        });
      } else {
        return NextResponse.json(
          {
            message: "Token valid but user not found",
            userId: authPayload.userId,
          },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        {
          message: "No valid authentication token",
          cookies: request.cookies.getAll().map((c) => c.name),
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Auth test: Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
