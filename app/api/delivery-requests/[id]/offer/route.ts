import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import DeliveryRequest from "@/lib/models/DeliveryRequest";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Ensure User model is registered
    User;

    // Verify authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const requestId = params.id;
    const userId = decoded.userId;

    // Find the delivery request
    const deliveryRequest = await DeliveryRequest.findById(requestId).populate(
      "userId",
      "firstName lastName email"
    );

    if (!deliveryRequest) {
      return NextResponse.json(
        { error: "Delivery request not found" },
        { status: 404 }
      );
    }

    // Check if user is trying to deliver their own request
    if (deliveryRequest.userId._id.toString() === userId) {
      return NextResponse.json(
        { error: "You cannot deliver your own request" },
        { status: 400 }
      );
    }

    // Check if request is still available
    if (deliveryRequest.status !== "pending") {
      return NextResponse.json(
        { error: "This delivery request is no longer available" },
        { status: 400 }
      );
    }

    // Get deliverer info for the response
    const deliverer = await User.findById(userId).select(
      "firstName lastName email"
    );

    if (!deliverer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // TODO: In a real implementation, you would:
    // 1. Create a "DeliveryOffer" model to track offers
    // 2. Notify the request owner via push notification/email
    // 3. Allow the request owner to accept/decline offers
    // 4. Update the request status when an offer is accepted
    // 5. Handle payment and delivery tracking

    // For now, we'll return a success message with request details
    const response = {
      success: true,
      message: `Offer submitted! We'll notify ${deliveryRequest.userId.firstName} that you want to deliver their item.`,
      requestDetails: {
        id: deliveryRequest._id,
        itemDescription: deliveryRequest.itemDescription,
        itemSize: deliveryRequest.itemSize,
        pickupLocation: deliveryRequest.pickupLocation,
        dropoffLocation: deliveryRequest.dropoffLocation,
        paymentAmount: deliveryRequest.paymentAmount,
        pickupDate: deliveryRequest.pickupDate,
        pickupTime: deliveryRequest.pickupTime,
        ownerName: `${deliveryRequest.userId.firstName} ${deliveryRequest.userId.lastName}`,
        ownerEmail: deliveryRequest.userId.email,
        contactInfo: deliveryRequest.contactInfo,
      },
      delivererDetails: {
        name: `${deliverer.firstName} ${deliverer.lastName}`,
        email: deliverer.email,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Offer to deliver error:", error);
    return NextResponse.json(
      { error: "Failed to submit delivery offer" },
      { status: 500 }
    );
  }
}
