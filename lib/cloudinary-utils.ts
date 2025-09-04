import cloudinary from "./cloudinary";

export interface UploadResult {
  secure_url: string;
  public_id: string;
}

export async function uploadImageToCloudinary(
  base64Image: string,
  folder: string = "campusconnect"
): Promise<UploadResult> {
  try {
    // Remove the data:image/jpeg;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Data}`,
      {
        folder: folder,
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" }, // Resize images
          { quality: "auto" }, // Optimize quality
        ],
      }
    );

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

export async function deleteImageFromCloudinary(
  publicId: string
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
}
