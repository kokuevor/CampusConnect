import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import {
  generateVerificationCode,
  getVerificationExpiration,
} from "@/lib/phone-utils";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { phoneNumber } = body;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
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

    // Generate new verification code
    const newVerificationCode = generateVerificationCode();
    const newVerificationExpires = getVerificationExpiration();

    // Update user with new verification code
    user.phoneVerificationCode = newVerificationCode;
    user.phoneVerificationExpires = newVerificationExpires;
    await user.save();

    // In a real application, you would send this code via SMS
    return NextResponse.json(
      {
        message: "New verification code sent successfully",
        expiresAt: newVerificationExpires,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
