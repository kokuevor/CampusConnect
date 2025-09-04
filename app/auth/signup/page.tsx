"use client";

import type React from "react";
import { useApp } from "@/lib/app-context";
import { validateImageFile } from "@/lib/image-utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Shield, Truck, Loader2, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Simple theme toggle for auth pages
function SimpleThemeToggle() {
  const toggleTheme = () => {
    const currentTheme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(currentTheme);
    localStorage.setItem("campusconnect-theme", currentTheme);
  };

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export default function SignUpPage() {
  const { dispatch, state } = useApp();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    phoneNumber: "",
    agreeToTerms: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState({
    studentId: null as File | null,
    selfie: null as File | null,
  });
  const [imagePreviews, setImagePreviews] = useState({
    studentId: null as string | null,
    selfie: null as string | null,
  });
  const [uploading, setUploading] = useState({
    studentId: false,
    selfie: false,
  });
  const [phoneVerificationStep, setPhoneVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [studentIdValidation, setStudentIdValidation] = useState<{
    isValid: boolean;
    confidence: number;
    reasons: string[];
    suggestions: string[];
    feedback: string;
  } | null>(null);
  const [isValidatingStudentId, setIsValidatingStudentId] = useState(false);
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      router.push("/dashboard");
    }
  }, [state.isAuthenticated, state.user, router]);

  const validateEmail = (email: string) => {
    return (
      email.endsWith("@st.knust.edu.gh") ||
      email.endsWith("@knust.edu.gh") ||
      email.endsWith(".edu") ||
      email.includes("university") ||
      email.includes("college")
    );
  };

  const validateGhanaPhoneNumber = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Check if it starts with +233 and has exactly 13 digits
    if (cleanNumber.startsWith("+233") && cleanNumber.length === 13) {
      return true;
    }

    // Check if it starts with 233 and has exactly 12 digits
    if (cleanNumber.startsWith("233") && cleanNumber.length === 12) {
      return true;
    }

    // Check if it starts with 0 and has exactly 10 digits (local format)
    if (cleanNumber.startsWith("0") && cleanNumber.length === 10) {
      return true;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Please use your university email address (@st.knust.edu.gh)");
      return;
    }

    if (!validateGhanaPhoneNumber(formData.phoneNumber)) {
      setError(
        "Please enter a valid Ghana phone number (e.g., +233XXXXXXXXX or 0XXXXXXXXX)"
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    if (!uploadedFiles.studentId || !uploadedFiles.selfie) {
      setError("Please upload both student ID and selfie for verification");
      return;
    }

    if (!studentIdValidation?.isValid) {
      setError(
        "Please validate your student ID first. Click 'Validate Student ID' after uploading."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Convert files to base64 for API
      const studentIdBase64 = await fileToBase64(uploadedFiles.studentId!);
      const selfieBase64 = await fileToBase64(uploadedFiles.selfie!);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          studentId: formData.studentId,
          phoneNumber: formData.phoneNumber,
          studentIdImage: studentIdBase64,
          selfieImage: selfieBase64,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // Store user data in context and localStorage
      dispatch({ type: "SET_USER", payload: data.user });

      // Show phone verification step
      setPhoneVerificationStep(true);
    } catch (error) {
      console.error("Signup error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleVerifyPhone = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setIsVerifyingPhone(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          verificationCode: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Phone verification failed");
      }

      setPhoneVerified(true);
      setPhoneVerificationStep(false);
      setError("");

      // Redirect to dashboard after successful verification
      router.push("/dashboard");
    } catch (error) {
      console.error("Phone verification error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Phone verification failed. Please try again."
      );
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleResendCode = async () => {
    setIsVerifyingPhone(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification code");
      }

      setError("");
    } catch (error) {
      console.error("Resend code error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to resend verification code. Please try again."
      );
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const validateStudentID = async () => {
    if (!uploadedFiles.studentId || !formData.studentId.trim()) {
      setError(
        "Please upload a student ID image and enter your student ID first"
      );
      return;
    }

    setIsValidatingStudentId(true);
    setError("");

    try {
      // Convert file to base64
      const studentIdBase64 = await fileToBase64(uploadedFiles.studentId);

      const response = await fetch("/api/validate-student-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentIdImage: studentIdBase64,
          studentId: formData.studentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate student ID");
      }

      setStudentIdValidation(data);

      if (data.isValid) {
        setError("");
      } else {
        setError(data.feedback);
      }
    } catch (error) {
      console.error("Student ID validation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to validate student ID. Please try again."
      );
    } finally {
      setIsValidatingStudentId(false);
    }
  };

  const handleFileUpload = (type: "studentId" | "selfie") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log(`Uploading ${type}:`, file.name, file.size, file.type);

        setUploading((prev) => ({ ...prev, [type]: true }));

        try {
          // Validate file
          const validation = validateImageFile(file);
          if (!validation.isValid) {
            setError(validation.error || "Invalid file");
            return;
          }

          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = e.target?.result as string;
            setImagePreviews((prev) => ({ ...prev, [type]: preview }));
          };
          reader.readAsDataURL(file);

          setUploadedFiles((prev) => ({ ...prev, [type]: file }));
          setError(""); // Clear any previous errors
          console.log(`${type} uploaded successfully`);
        } catch (error) {
          console.error(`Error uploading ${type}:`, error);
          setError(`Failed to upload ${type}. Please try again.`);
        } finally {
          setUploading((prev) => ({ ...prev, [type]: false }));
        }
      }
    };
    input.click();
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Student Verification</CardTitle>
              <CardDescription>
                Upload your student ID and a selfie for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload Student ID
                  </p>
                  {uploadedFiles.studentId && (
                    <p className="text-xs text-emerald-600 mb-2">
                      ✓ {uploadedFiles.studentId.name}
                    </p>
                  )}
                  {imagePreviews.studentId && (
                    <div className="mb-3">
                      <img
                        src={imagePreviews.studentId}
                        alt="Student ID Preview"
                        className="w-32 h-20 object-cover rounded border mx-auto"
                      />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleFileUpload("studentId")}
                    disabled={uploading.studentId}
                  >
                    {uploading.studentId ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : uploadedFiles.studentId ? (
                      "Change File"
                    ) : (
                      "Choose File"
                    )}
                  </Button>

                  {uploadedFiles.studentId && (
                    <div className="mt-3">
                      <Button
                        onClick={validateStudentID}
                        disabled={
                          isValidatingStudentId || !formData.studentId.trim()
                        }
                        className="w-full"
                        variant="secondary"
                      >
                        {isValidatingStudentId ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          "🔍 Validate Student ID"
                        )}
                      </Button>

                      {studentIdValidation && (
                        <div
                          className={`mt-2 p-2 rounded text-xs ${
                            studentIdValidation.isValid
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          <div className="font-medium">
                            {studentIdValidation.isValid
                              ? "✅ Valid"
                              : "❌ Invalid"}
                            ({studentIdValidation.confidence}% confidence)
                          </div>
                          {studentIdValidation.reasons.length > 0 && (
                            <div className="mt-1">
                              <div className="font-medium">Reasons:</div>
                              <ul className="list-disc list-inside">
                                {studentIdValidation.reasons.map(
                                  (reason, index) => (
                                    <li key={index}>{reason}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {!studentIdValidation.isValid &&
                            studentIdValidation.suggestions.length > 0 && (
                              <div className="mt-1">
                                <div className="font-medium">Suggestions:</div>
                                <ul className="list-disc list-inside">
                                  {studentIdValidation.suggestions.map(
                                    (suggestion, index) => (
                                      <li key={index}>{suggestion}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload Selfie
                  </p>
                  {uploadedFiles.selfie && (
                    <p className="text-xs text-emerald-600 mb-2">
                      ✓ {uploadedFiles.selfie.name}
                    </p>
                  )}
                  {imagePreviews.selfie && (
                    <div className="mb-3">
                      <img
                        src={imagePreviews.selfie}
                        alt="Selfie Preview"
                        className="w-32 h-20 object-cover rounded border mx-auto"
                      />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleFileUpload("selfie")}
                    disabled={uploading.selfie}
                  >
                    {uploading.selfie ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : uploadedFiles.selfie ? (
                      "Change File"
                    ) : (
                      "Choose File"
                    )}
                  </Button>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your documents will be reviewed within 24 hours. You'll
                  receive an email once verified.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <p>Debug Info:</p>
                  <p>
                    Student ID:{" "}
                    {uploadedFiles.studentId
                      ? uploadedFiles.studentId.name
                      : "Not uploaded"}
                  </p>
                  <p>
                    Selfie:{" "}
                    {uploadedFiles.selfie
                      ? uploadedFiles.selfie.name
                      : "Not uploaded"}
                  </p>
                  <p>
                    Uploading Student ID: {uploading.studentId ? "Yes" : "No"}
                  </p>
                  <p>Uploading Selfie: {uploading.selfie ? "Yes" : "No"}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (phoneVerificationStep) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Phone Verification</CardTitle>
              <CardDescription>
                Enter the verification code sent to {formData.phoneNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={handleVerifyPhone}
                  disabled={isVerifyingPhone || !verificationCode.trim()}
                  className="flex-1"
                >
                  {isVerifyingPhone ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Phone"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isVerifyingPhone}
                >
                  {isVerifyingPhone ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Resend"
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => setPhoneVerificationStep(false)}
                className="w-full"
              >
                Back to Signup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Theme Toggle */}
        <div className="flex justify-end">
          <SimpleThemeToggle />
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-primary rounded-lg p-2">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              CampusConnect
            </h1>
          </div>
          <p className="text-muted-foreground">
            Join the trusted student delivery network
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Sign up with your university email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">University Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@st.knust.edu.gh"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  placeholder="123456789"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Ghana phone number for verification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      agreeToTerms: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the terms and conditions
                </Label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                Continue to Verification
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
