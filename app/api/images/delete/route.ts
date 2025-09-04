import { type NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { deleteImageFromCloudinary } from "@/lib/cloudinary-utils";

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request
    const authPayload = await authenticateRequest(request);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    // Delete image from Cloudinary
    await deleteImageFromCloudinary(publicId);

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
