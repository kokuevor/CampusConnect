import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      verificationStatus: user.verificationStatus,
    });

    // Return user data (without password)
    const userData = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
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
    };

    const response = NextResponse.json({
      message: "Login successful",
      user: userData,
      token,
    });

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
