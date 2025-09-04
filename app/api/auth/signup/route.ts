import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword, generateToken } from "@/lib/auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary-utils";
import {
  validateGhanaPhoneNumber,
  formatGhanaPhoneNumber,
  generateVerificationCode,
  getVerificationExpiration,
} from "@/lib/phone-utils";
import { validateKNUSTStudentID } from "@/lib/student-id-validation";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      studentId,
      phoneNumber,
      studentIdImage,
      selfieImage,
    } = body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !studentId ||
      !phoneNumber
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate Ghana phone number
    if (!validateGhanaPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Ghana phone number (e.g., +233XXXXXXXXX or 0XXXXXXXXX)",
        },
        { status: 400 }
      );
    }

    // Format phone number to international format
    const formattedPhoneNumber = formatGhanaPhoneNumber(phoneNumber);

    // Validate KNUST student ID
    let studentIdValidationResult = null;
    if (studentIdImage) {
      studentIdValidationResult = await validateKNUSTStudentID(
        studentIdImage,
        studentId
      );
      if (!studentIdValidationResult.isValid) {
        return NextResponse.json(
          {
            error: "Invalid KNUST student ID card",
            validationDetails: studentIdValidationResult,
          },
          { status: 400 }
        );
      }
    }

    // Validate university email domain
    const emailDomain = email.split("@")[1];
    const allowedDomains = [
      "st.knust.edu.gh",
      "knust.edu.gh",
      "university.edu",
      "school.edu",
      "college.edu",
    ]; // Add your school domains
    if (!allowedDomains.some((domain) => emailDomain.endsWith(domain))) {
      return NextResponse.json(
        {
          error: "Please use your university email address (@st.knust.edu.gh)",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { studentId }, { phoneNumber: formattedPhoneNumber }],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "User with this email, student ID, or phone number already exists",
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Upload images to Cloudinary
    let studentIdCloudinaryData = null;
    let selfieCloudinaryData = null;

    if (studentIdImage) {
      try {
        studentIdCloudinaryData = await uploadImageToCloudinary(
          studentIdImage,
          "campusconnect/student-ids"
        );
      } catch (error) {
        console.error("Student ID upload error:", error);
        return NextResponse.json(
          { error: "Failed to upload student ID image" },
          { status: 500 }
        );
      }
    }

    if (selfieImage) {
      try {
        selfieCloudinaryData = await uploadImageToCloudinary(
          selfieImage,
          "campusconnect/selfies"
        );
      } catch (error) {
        console.error("Selfie upload error:", error);
        return NextResponse.json(
          { error: "Failed to upload selfie image" },
          { status: 500 }
        );
      }
    }

    // Generate verification code for phone
    const verificationCode = generateVerificationCode();
    const verificationExpires = getVerificationExpiration();

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      studentId,
      phoneNumber: formattedPhoneNumber,
      phoneVerified: false,
      phoneVerificationCode: verificationCode,
      phoneVerificationExpires: verificationExpires,
      studentIdValidated: studentIdValidationResult?.isValid || false,
      studentIdValidationScore: studentIdValidationResult?.confidence || 0,
      studentIdImage: studentIdCloudinaryData
        ? {
            url: studentIdCloudinaryData.secure_url,
            publicId: studentIdCloudinaryData.public_id,
          }
        : undefined,
      selfieImage: selfieCloudinaryData
        ? {
            url: selfieCloudinaryData.secure_url,
            publicId: selfieCloudinaryData.public_id,
          }
        : undefined,
      verificationStatus: studentIdValidationResult?.isValid
        ? "verified"
        : "pending_verification",
    });

    await user.save();

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

    const response = NextResponse.json(
      {
        message: "User created successfully",
        user: userData,
        token,
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
