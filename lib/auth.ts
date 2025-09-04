import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

console.log(
  "JWT_SECRET configured:",
  !!JWT_SECRET,
  "Length:",
  JWT_SECRET?.length
);

export interface JWTPayload {
  userId: string;
  email: string;
  verificationStatus: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  console.log("Generating token with secret length:", JWT_SECRET?.length);
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  console.log("Token generated successfully, length:", token.length);
  return token;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    console.log("Verifying token with secret length:", JWT_SECRET?.length);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log("Token verified successfully:", decoded);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Also check cookies as fallback
  const token = request.cookies.get("auth-token")?.value;
  return token || null;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  return verifyToken(token);
}
