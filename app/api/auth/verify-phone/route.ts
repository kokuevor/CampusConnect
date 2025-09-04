import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { isVerificationCodeExpired } from "@/lib/phone-utils";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { phoneNumber, verificationCode } = body;

    // Validate required fields
    if (!phoneNumber || !verificationCode) {
      return NextResponse.json(
        { error: "Phone number and verification code are required" },
        { status: 400 }
      );
    }

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if phone is already verified
    if (user.phoneVerified) {
      return NextResponse.json(
        { error: "Phone number is already verified" },
        { status: 400 }
      );
    }

    // Check if verification code matches
    if (user.phoneVerificationCode !== verificationCode) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Check if verification code is expired
    if (
      user.phoneVerificationExpires &&
      isVerificationCodeExpired(user.phoneVerificationExpires)
    ) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark phone as verified
    user.phoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;

    // Update verification status to verified if student ID is also validated
    if (user.studentIdValidated) {
      user.verificationStatus = "verified";
    }

    await user.save();

    return NextResponse.json(
      {
        message: "Phone number verified successfully",
        phoneVerified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Phone verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
