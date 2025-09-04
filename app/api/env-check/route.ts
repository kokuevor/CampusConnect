import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Environment check",
    env: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      hasDbUri: !!process.env.DB_URI,
      nodeEnv: process.env.NODE_ENV,
      jwtSecretPreview: process.env.JWT_SECRET
        ? process.env.JWT_SECRET.substring(0, 10) + "..."
        : "Not set",
    },
  });
}




