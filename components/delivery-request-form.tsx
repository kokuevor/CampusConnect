"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, DollarSign, Clock, Package, AlertCircle } from "lucide-react";
import { KNUST_CAMPUS_LOCATIONS, type ILocation } from "@/lib/types/trip";

interface DeliveryRequestFormProps {
  onSubmit?: (request: any) => void;
  onCancel?: () => void;
}

export function DeliveryRequestForm({
  onSubmit,
  onCancel,
}: DeliveryRequestFormProps) {
  const [formData, setFormData] = useState({
    pickupLocation: {
      type: "campus" as "campus" | "off-campus",
      campusLocation: undefined as string | undefined,
      offCampusAddress: "",
    } as ILocation,
    dropoffLocation: {
      type: "campus" as "campus" | "off-campus",
      campusLocation: undefined as string | undefined,
      offCampusAddress: "",
    } as ILocation,
    itemDescription: "",
    itemSize: "Small" as "Small" | "Medium" | "Large",
    priority: "normal" as "normal" | "high" | "urgent",
    paymentAmount: "",
    pickupDate: "",
    pickupTime: "",
    contactInfo: "",
    specialInstructions: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.itemDescription.trim())
      newErrors.itemDescription = "Item description is required";

    // Validate pickup location
    if (
      formData.pickupLocation.type === "campus" &&
      !formData.pickupLocation.campusLocation
    ) {
      newErrors.pickupLocation = "Please select a campus location";
    } else if (
      formData.pickupLocation.type === "off-campus" &&
      !formData.pickupLocation.offCampusAddress
    ) {
      newErrors.pickupLocation = "Please enter the off-campus address";
    }

    // Validate dropoff location
    if (
      formData.dropoffLocation.type === "campus" &&
      !formData.dropoffLocation.campusLocation
    ) {
      newErrors.dropoffLocation = "Please select a campus location";
    } else if (
      formData.dropoffLocation.type === "off-campus" &&
      !formData.dropoffLocation.offCampusAddress
    ) {
      newErrors.dropoffLocation = "Please enter the off-campus address";
    }

    if (!formData.pickupDate) newErrors.pickupDate = "Pickup date is required";
    if (
      !formData.paymentAmount ||
      Number.parseFloat(formData.paymentAmount) < 1
    ) {
      newErrors.paymentAmount = "Payment amount must be at least GHC 1";
    }

    // Check if pickup and dropoff locations are the same
    const pickupLocationStr =
      formData.pickupLocation.type === "campus"
        ? formData.pickupLocation.campusLocation
        : formData.pickupLocation.offCampusAddress;
    const dropoffLocationStr =
      formData.dropoffLocation.type === "campus"
        ? formData.dropoffLocation.campusLocation
        : formData.dropoffLocation.offCampusAddress;

    if (
      pickupLocationStr === dropoffLocationStr &&
      formData.pickupLocation.type === formData.dropoffLocation.type
    ) {
      newErrors.dropoffLocation =
        "Pickup and delivery locations must be different";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/delivery-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create delivery request");
      }

      // Reset form
      setFormData({
        pickupLocation: {
          type: "campus",
          campusLocation: undefined,
          offCampusAddress: "",
        },
        dropoffLocation: {
          type: "campus",
          campusLocation: undefined,
          offCampusAddress: "",
        },
        itemDescription: "",
        itemSize: "Small",
        priority: "normal",
        paymentAmount: "",
        pickupDate: "",
        pickupTime: "",
        contactInfo: "",
        specialInstructions: "",
      });

      setSuccess("Delivery request created successfully!");
      onSubmit?.(formData);
    } catch (error) {
      console.error("Create delivery request error:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Failed to create delivery request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationTypeChange = (
    locationType: "pickup" | "dropoff",
    type: "campus" | "off-campus"
  ) => {
    const locationKey =
      locationType === "pickup" ? "pickupLocation" : "dropoffLocation";
    setFormData({
      ...formData,
      [locationKey]: {
        type,
        campusLocation: type === "campus" ? undefined : undefined,
        offCampusAddress: type === "off-campus" ? "" : undefined,
      },
    });
  };

  const handleCampusLocationChange = (
    locationType: "pickup" | "dropoff",
    location: string
  ) => {
    const locationKey =
      locationType === "pickup" ? "pickupLocation" : "dropoffLocation";
    setFormData({
      ...formData,
      [locationKey]: {
        ...formData[locationKey],
        campusLocation: location,
      },
    });
  };

  const handleOffCampusAddressChange = (
    locationType: "pickup" | "dropoff",
    address: string
  ) => {
    const locationKey =
      locationType === "pickup" ? "pickupLocation" : "dropoffLocation";
    setFormData({
      ...formData,
      [locationKey]: {
        ...formData[locationKey],
        offCampusAddress: address,
      },
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-500">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium Priority</Badge>;
      case "low":
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Create Delivery Request</span>
          </CardTitle>
          <CardDescription>
            Fill out the details for your delivery request. All fields marked
            with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="itemDescription">Item Description *</Label>
                <Textarea
                  id="itemDescription"
                  placeholder="Describe what you need delivered (e.g., 'Laptop and books', 'Medical supplies')"
                  value={formData.itemDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      itemDescription: e.target.value,
                    })
                  }
                  className={errors.itemDescription ? "border-destructive" : ""}
                  rows={3}
                />
                {errors.itemDescription && (
                  <p className="text-sm text-destructive">
                    {errors.itemDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Location Type */}
                <div className="space-y-2">
                  <Label htmlFor="pickupLocationType">
                    Pickup Location Type *
                  </Label>
                  <Select
                    value={formData.pickupLocation.type}
                    onValueChange={(value: "campus" | "off-campus") =>
                      handleLocationTypeChange("pickup", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campus">Campus</SelectItem>
                      <SelectItem value="off-campus">Off Campus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dropoff Location Type */}
                <div className="space-y-2">
                  <Label htmlFor="dropoffLocationType">
                    Delivery Location Type *
                  </Label>
                  <Select
                    value={formData.dropoffLocation.type}
                    onValueChange={(value: "campus" | "off-campus") =>
                      handleLocationTypeChange("dropoff", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campus">Campus</SelectItem>
                      <SelectItem value="off-campus">Off Campus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Location Details */}
                <div className="space-y-2">
                  <Label htmlFor="pickupLocationDetails">
                    Pickup Location Details *
                  </Label>
                  {formData.pickupLocation.type === "campus" ? (
                    <Select
                      value={formData.pickupLocation.campusLocation || ""}
                      onValueChange={(value) =>
                        handleCampusLocationChange("pickup", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.pickupLocation ? "border-destructive" : ""
                        }
                      >
                        <SelectValue placeholder="Select campus location" />
                      </SelectTrigger>
                      <SelectContent>
                        {KNUST_CAMPUS_LOCATIONS.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Enter off-campus address"
                      value={formData.pickupLocation.offCampusAddress || ""}
                      onChange={(e) =>
                        handleOffCampusAddressChange("pickup", e.target.value)
                      }
                      className={
                        errors.pickupLocation ? "border-destructive" : ""
                      }
                    />
                  )}
                  {errors.pickupLocation && (
                    <p className="text-sm text-destructive">
                      {errors.pickupLocation}
                    </p>
                  )}
                </div>

                {/* Dropoff Location Details */}
                <div className="space-y-2">
                  <Label htmlFor="dropoffLocationDetails">
                    Delivery Location Details *
                  </Label>
                  {formData.dropoffLocation.type === "campus" ? (
                    <Select
                      value={formData.dropoffLocation.campusLocation || ""}
                      onValueChange={(value) =>
                        handleCampusLocationChange("dropoff", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.dropoffLocation ? "border-destructive" : ""
                        }
                      >
                        <SelectValue placeholder="Select campus location" />
                      </SelectTrigger>
                      <SelectContent>
                        {KNUST_CAMPUS_LOCATIONS.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Enter off-campus address"
                      value={formData.dropoffLocation.offCampusAddress || ""}
                      onChange={(e) =>
                        handleOffCampusAddressChange("dropoff", e.target.value)
                      }
                      className={
                        errors.dropoffLocation ? "border-destructive" : ""
                      }
                    />
                  )}
                  {errors.dropoffLocation && (
                    <p className="text-sm text-destructive">
                      {errors.dropoffLocation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Timing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Timing</span>
              </h3>

              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date *</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) =>
                    setFormData({ ...formData, pickupDate: e.target.value })
                  }
                  className={errors.pickupDate ? "border-destructive" : ""}
                />
                {errors.pickupDate && (
                  <p className="text-sm text-destructive">
                    {errors.pickupDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupTime">Pickup Time</Label>
                <Input
                  id="pickupTime"
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e) =>
                    setFormData({ ...formData, pickupTime: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      priority: value as "normal" | "high" | "urgent",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Current:
                  </span>
                  {getPriorityBadge(formData.priority)}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Payment</span>
              </h3>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount (GHC) *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min="1"
                  step="0.50"
                  placeholder="5.00"
                  value={formData.paymentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentAmount: e.target.value })
                  }
                  className={errors.paymentAmount ? "border-destructive" : ""}
                />
                {errors.paymentAmount && (
                  <p className="text-sm text-destructive">
                    {errors.paymentAmount}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Suggested: GHC 3-8 for on-campus deliveries, GHC 8-15 for
                  longer distances
                </p>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>

              <div className="space-y-2">
                <Label htmlFor="specialInstructions">
                  Special Instructions
                </Label>
                <Textarea
                  id="specialInstructions"
                  placeholder="Any special handling instructions, contact details, or additional notes..."
                  value={formData.specialInstructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialInstructions: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your request will be visible to verified students only. You'll
                be notified when someone accepts your delivery request.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Creating Request..." : "Create Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
