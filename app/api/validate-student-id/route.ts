import { type NextRequest, NextResponse } from "next/server";
import {
  validateKNUSTStudentID,
  getValidationFeedback,
} from "@/lib/student-id-validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentIdImage, studentId } = body;

    // Validate required fields
    if (!studentIdImage || !studentId) {
      return NextResponse.json(
        { error: "Student ID image and student ID are required" },
        { status: 400 }
      );
    }

    // Validate KNUST student ID
    const validationResult = await validateKNUSTStudentID(
      studentIdImage,
      studentId
    );
    const feedback = getValidationFeedback(validationResult);

    return NextResponse.json({
      isValid: validationResult.isValid,
      confidence: validationResult.confidence,
      reasons: validationResult.reasons,
      suggestions: validationResult.suggestions,
      feedback: feedback,
    });
  } catch (error) {
    console.error("Student ID validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate student ID" },
      { status: 500 }
    );
  }
}
