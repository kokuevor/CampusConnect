// Student ID validation utilities for KNUST

export interface StudentIDValidationResult {
  isValid: boolean;
  confidence: number;
  reasons: string[];
  suggestions: string[];
}

// KNUST-specific validation patterns
const KNUST_PATTERNS = {
  // Common KNUST identifiers
  identifiers: [
    "KNUST",
    "KWAME NKRUMAH UNIVERSITY OF SCIENCE AND TECHNOLOGY",
    "KWAME NKRUMAH",
    "UNIVERSITY OF SCIENCE AND TECHNOLOGY",
    "COLLEGE OF",
    "FACULTY OF",
    "SCHOOL OF",
    "DEPARTMENT OF",
  ],

  // KNUST color schemes (in hex)
  colors: [
    "#1f4e79", // KNUST blue
    "#c8102e", // KNUST red
    "#f4f4f4", // Light gray
    "#ffffff", // White
    "#000000", // Black
  ],

  // Common KNUST departments/faculties
  departments: [
    "COLLEGE OF SCIENCE",
    "COLLEGE OF HEALTH SCIENCES",
    "COLLEGE OF HUMANITIES AND SOCIAL SCIENCES",
    "COLLEGE OF ENGINEERING",
    "COLLEGE OF AGRICULTURE AND NATURAL RESOURCES",
    "COLLEGE OF ART AND BUILT ENVIRONMENT",
    "FACULTY OF PHARMACY",
    "FACULTY OF LAW",
    "SCHOOL OF BUSINESS",
    "SCHOOL OF MEDICINE",
    "SCHOOL OF DENTISTRY",
    "SCHOOL OF VETERINARY MEDICINE",
  ],
};

// KNUST student ID patterns (based on actual KNUST student IDs)
const KNUST_STUDENT_ID_PATTERNS = [
  /^\d{8}$/, // 8-digit format (like 20466235)
  /^\d{9}$/, // 9-digit format
  /^\d{10}$/, // 10-digit format
  /^[A-Z]{2}\d{6}$/, // 2 letters + 6 digits (like PG7084816)
  /^[A-Z]{2}\d{7}$/, // 2 letters + 7 digits
  /^[A-Z]{3}\d{6}$/, // 3 letters + 6 digits
  /^[A-Z]{1}\d{8}$/, // 1 letter + 8 digits
  /^[A-Z]{4}\d{5}$/, // 4 letters + 5 digits
];

// Validate KNUST student ID card (server-side compatible)
export async function validateKNUSTStudentID(
  imageData: string,
  studentId: string
): Promise<StudentIDValidationResult> {
  const result: StudentIDValidationResult = {
    isValid: false,
    confidence: 0,
    reasons: [],
    suggestions: [],
  };

  try {
    // Student ID format validation (80% weight)
    const studentIdValid = validateStudentIDFormat(studentId);

    // Basic image validation (20% weight)
    const imageValidationScore = await validateImageBasic(imageData);

    // Calculate confidence score
    let confidence = 0;
    const reasons: string[] = [];
    const suggestions: string[] = [];

    // Student ID format check (80% weight) - This is the most important
    if (studentIdValid) {
      confidence += 80;
      reasons.push("Valid KNUST student ID format");
    } else {
      reasons.push("Student ID format appears invalid");
      suggestions.push(
        "Ensure the student ID follows KNUST format (e.g., 20466235, PG7084816, 123456789, AB1234567)"
      );
    }

    // Basic image validation (20% weight) - Much more lenient
    if (imageValidationScore > 0.3) {
      // Lowered threshold
      confidence += 20;
      reasons.push("Image format is acceptable");
    } else if (imageValidationScore > 0.1) {
      // Even more lenient
      confidence += imageValidationScore * 20;
      reasons.push("Image quality is acceptable");
    } else {
      reasons.push("Image format could be improved");
      suggestions.push(
        "Ensure the image is clear enough to read the student ID details"
      );
    }

    // Set validation result - Lowered threshold to 60%
    result.isValid = confidence >= 60; // More lenient threshold
    result.confidence = Math.round(confidence);
    result.reasons = reasons;
    result.suggestions = suggestions;
  } catch (error) {
    console.error("Student ID validation error:", error);
    result.reasons.push("Error processing image");
    result.suggestions.push("Please try uploading the image again");
  }

  return result;
}

// Basic image validation (server-side compatible)
async function validateImageBasic(imageData: string): Promise<number> {
  try {
    // Check if it's a valid base64 image
    if (!imageData.startsWith("data:image/")) {
      return 0.2;
    }

    // Extract image format
    const formatMatch = imageData.match(/data:image\/(\w+);base64,/);
    if (!formatMatch) {
      return 0.2;
    }

    const format = formatMatch[1].toLowerCase();

    // Check for supported formats
    const supportedFormats = ["jpeg", "jpg", "png", "webp"];
    if (!supportedFormats.includes(format)) {
      return 0.3;
    }

    // Check base64 data length (rough quality indicator)
    const base64Data = imageData.split(",")[1];
    if (!base64Data) {
      return 0.2;
    }

    // Calculate approximate file size
    const fileSizeBytes = Math.ceil((base64Data.length * 3) / 4);
    const fileSizeKB = fileSizeBytes / 1024;

    // Much more lenient quality scoring based on file size
    if (fileSizeKB > 100) {
      return 0.8; // Good quality
    } else if (fileSizeKB > 50) {
      return 0.6; // Acceptable quality
    } else if (fileSizeKB > 20) {
      return 0.4; // Basic quality
    } else {
      return 0.2; // Low quality but still acceptable
    }
  } catch (error) {
    console.error("Image validation error:", error);
    return 0.2;
  }
}

// Validate student ID format
function validateStudentIDFormat(studentId: string): boolean {
  return KNUST_STUDENT_ID_PATTERNS.some((pattern) => pattern.test(studentId));
}

// Get validation feedback message
export function getValidationFeedback(
  result: StudentIDValidationResult
): string {
  if (result.isValid) {
    return `✅ Student ID validated successfully (${result.confidence}% confidence)`;
  } else {
    const feedback = `❌ Student ID validation failed (${result.confidence}% confidence)\n\n`;
    const reasons = result.reasons.map((reason) => `• ${reason}`).join("\n");
    const suggestions = result.suggestions
      .map((suggestion) => `• ${suggestion}`)
      .join("\n");

    return `${feedback}Issues found:\n${reasons}\n\nSuggestions:\n${suggestions}`;
  }
}
