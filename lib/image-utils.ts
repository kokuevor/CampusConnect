// Image optimization utilities for Cloudinary
export const CLOUDINARY_CONFIG = {
  // Default transformations for uploaded images
  defaultTransformations: {
    width: 800,
    height: 600,
    crop: "limit",
    quality: "auto",
    format: "auto",
  },

  // Thumbnail transformations
  thumbnailTransformations: {
    width: 150,
    height: 150,
    crop: "fill",
    gravity: "face",
    quality: "auto",
  },

  // Profile image transformations
  profileTransformations: {
    width: 200,
    height: 200,
    crop: "fill",
    gravity: "face",
    quality: "auto",
  },
};

// Generate Cloudinary URL with transformations
export function getCloudinaryUrl(publicId: string, transformations: any = {}) {
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  const transformString = Object.entries(transformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(",");

  return `${baseUrl}/${transformString}/${publicId}`;
}

// Validate image file
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: "File size must be less than 5MB" };
  }

  // Check file type
  if (!file.type.startsWith("image/")) {
    return { isValid: false, error: "Please select a valid image file" };
  }

  // Check file extension
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (!allowedExtensions.includes(fileExtension)) {
    return { isValid: false, error: "Please select a JPG, PNG, or WebP image" };
  }

  return { isValid: true };
}
