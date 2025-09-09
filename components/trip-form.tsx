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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Clock, Users, Car, AlertCircle, Route } from "lucide-react";
import { KNUST_CAMPUS_LOCATIONS, type ILocation } from "@/lib/types/trip";

interface TripFormProps {
  onSubmit?: (trip: any) => void;
  onCancel?: () => void;
}

export function TripForm({ onSubmit, onCancel }: TripFormProps) {
  const [formData, setFormData] = useState({
    fromLocation: {
      type: "campus" as "campus" | "off-campus",
      campusLocation: undefined as string | undefined,
      offCampusAddress: "",
    } as ILocation,
    toLocation: {
      type: "campus" as "campus" | "off-campus",
      campusLocation: undefined as string | undefined,
      offCampusAddress: "",
    } as ILocation,
    departureDate: "",
    departureTime: "",
    availableSeats: 1,
    pricePerDelivery: "",
    vehicleType: "Car",
    description: "",
    contactInfo: "",
    recurringDays: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const transportMethods = [
    "Walking",
    "Bicycle",
    "Car",
    "Bus",
    "Scooter",
    "Skateboard",
  ];

  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate from location
    if (
      formData.fromLocation.type === "campus" &&
      !formData.fromLocation.campusLocation
    ) {
      newErrors.fromLocation = "Please select a campus location";
    } else if (
      formData.fromLocation.type === "off-campus" &&
      !formData.fromLocation.offCampusAddress
    ) {
      newErrors.fromLocation = "Please enter the off-campus address";
    }

    // Validate to location
    if (
      formData.toLocation.type === "campus" &&
      !formData.toLocation.campusLocation
    ) {
      newErrors.toLocation = "Please select a campus location";
    } else if (
      formData.toLocation.type === "off-campus" &&
      !formData.toLocation.offCampusAddress
    ) {
      newErrors.toLocation = "Please enter the off-campus address";
    }

    if (!formData.departureDate)
      newErrors.departureDate = "Departure date is required";
    if (!formData.departureTime)
      newErrors.departureTime = "Departure time is required";
    if (!formData.availableSeats || formData.availableSeats < 1) {
      newErrors.availableSeats = "Must accept at least 1 delivery";
    }
    if (
      !formData.pricePerDelivery ||
      Number.parseFloat(formData.pricePerDelivery) < 1
    ) {
      newErrors.pricePerDelivery = "Price per delivery must be at least GHC 1";
    }

    // Check if start and end locations are the same
    const fromLocationStr =
      formData.fromLocation.type === "campus"
        ? formData.fromLocation.campusLocation
        : formData.fromLocation.offCampusAddress;
    const toLocationStr =
      formData.toLocation.type === "campus"
        ? formData.toLocation.campusLocation
        : formData.toLocation.offCampusAddress;

    if (
      fromLocationStr === toLocationStr &&
      formData.fromLocation.type === formData.toLocation.type
    ) {
      newErrors.toLocation = "Start and end locations must be different";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to post trip");
      }

      // Reset form
      setFormData({
        fromLocation: {
          type: "campus",
          campusLocation: undefined,
          offCampusAddress: "",
        },
        toLocation: {
          type: "campus",
          campusLocation: undefined,
          offCampusAddress: "",
        },
        departureDate: "",
        departureTime: "",
        availableSeats: 1,
        pricePerDelivery: "",
        vehicleType: "Car",
        description: "",
        contactInfo: "",
        recurringDays: [],
      });

      setSuccess("Trip posted successfully!");
      onSubmit?.(formData);
    } catch (error) {
      console.error("Post trip error:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Failed to post trip. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecurringDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        recurringDays: [...formData.recurringDays, day],
      });
    } else {
      setFormData({
        ...formData,
        recurringDays: formData.recurringDays.filter((d) => d !== day),
      });
    }
  };

  const handleLocationTypeChange = (
    locationType: "from" | "to",
    type: "campus" | "off-campus"
  ) => {
    const locationKey = locationType === "from" ? "fromLocation" : "toLocation";
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
    locationType: "from" | "to",
    location: string
  ) => {
    const locationKey = locationType === "from" ? "fromLocation" : "toLocation";
    setFormData({
      ...formData,
      [locationKey]: {
        ...formData[locationKey],
        campusLocation: location,
      },
    });
  };

  const handleOffCampusAddressChange = (
    locationType: "from" | "to",
    address: string
  ) => {
    const locationKey = locationType === "from" ? "fromLocation" : "toLocation";
    setFormData({
      ...formData,
      [locationKey]: {
        ...formData[locationKey],
        offCampusAddress: address,
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Route className="h-5 w-5" />
            <span>Post New Trip</span>
          </CardTitle>
          <CardDescription>
            Share your travel plans and earn money by delivering items for
            fellow students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Route Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* From Location */}
                <div className="space-y-2">
                  <Label htmlFor="fromLocationType">
                    Start Location Type *
                  </Label>
                  <Select
                    value={formData.fromLocation.type}
                    onValueChange={(value: "campus" | "off-campus") =>
                      handleLocationTypeChange("from", value)
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

                {/* To Location */}
                <div className="space-y-2">
                  <Label htmlFor="toLocationType">End Location Type *</Label>
                  <Select
                    value={formData.toLocation.type}
                    onValueChange={(value: "campus" | "off-campus") =>
                      handleLocationTypeChange("to", value)
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
                {/* From Location Details */}
                <div className="space-y-2">
                  <Label htmlFor="fromLocationDetails">
                    Start Location Details *
                  </Label>
                  {formData.fromLocation.type === "campus" ? (
                    <Select
                      value={formData.fromLocation.campusLocation || ""}
                      onValueChange={(value) =>
                        handleCampusLocationChange("from", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.fromLocation ? "border-destructive" : ""
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
                      value={formData.fromLocation.offCampusAddress || ""}
                      onChange={(e) =>
                        handleOffCampusAddressChange("from", e.target.value)
                      }
                      className={
                        errors.fromLocation ? "border-destructive" : ""
                      }
                    />
                  )}
                  {errors.fromLocation && (
                    <p className="text-sm text-destructive">
                      {errors.fromLocation}
                    </p>
                  )}
                </div>

                {/* To Location Details */}
                <div className="space-y-2">
                  <Label htmlFor="toLocationDetails">
                    End Location Details *
                  </Label>
                  {formData.toLocation.type === "campus" ? (
                    <Select
                      value={formData.toLocation.campusLocation || ""}
                      onValueChange={(value) =>
                        handleCampusLocationChange("to", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.toLocation ? "border-destructive" : ""
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
                      value={formData.toLocation.offCampusAddress || ""}
                      onChange={(e) =>
                        handleOffCampusAddressChange("to", e.target.value)
                      }
                      className={errors.toLocation ? "border-destructive" : ""}
                    />
                  )}
                  {errors.toLocation && (
                    <p className="text-sm text-destructive">
                      {errors.toLocation}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Route Description</Label>
                <Textarea
                  id="description"
                  placeholder="Any specific details about your route, stops, or travel preferences..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            {/* Timing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Schedule</span>
              </h3>

              <div className="space-y-2">
                <Label htmlFor="departureDate">Departure Date *</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) =>
                    setFormData({ ...formData, departureDate: e.target.value })
                  }
                  className={errors.departureDate ? "border-destructive" : ""}
                />
                {errors.departureDate && (
                  <p className="text-sm text-destructive">
                    {errors.departureDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departureTime">Departure Time *</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) =>
                    setFormData({ ...formData, departureTime: e.target.value })
                  }
                  className={errors.departureTime ? "border-destructive" : ""}
                />
                {errors.departureTime && (
                  <p className="text-sm text-destructive">
                    {errors.departureTime}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRecurring"
                    checked={formData.recurringDays.length > 0}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        setFormData({
                          ...formData,
                          recurringDays: [],
                        });
                      }
                    }}
                  />
                  <Label htmlFor="isRecurring">This is a recurring trip</Label>
                </div>

                {formData.recurringDays.length > 0 && (
                  <div className="space-y-2 pl-6">
                    <Label>Recurring Days *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {weekDays.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={formData.recurringDays.includes(day)}
                            onCheckedChange={(checked) =>
                              handleRecurringDayChange(day, checked as boolean)
                            }
                          />
                          <Label htmlFor={day} className="text-sm">
                            {day.slice(0, 3)}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {errors.recurringDays && (
                      <p className="text-sm text-destructive">
                        {errors.recurringDays}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Transport & Capacity */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>Transport & Capacity</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, vehicleType: value })
                    }
                  >
                    <SelectTrigger
                      className={errors.vehicleType ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="How are you traveling?" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vehicleType && (
                    <p className="text-sm text-destructive">
                      {errors.vehicleType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableSeats">Available Seats *</Label>
                  <Select
                    value={formData.availableSeats.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        availableSeats: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger
                      className={
                        errors.availableSeats ? "border-destructive" : ""
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "seat" : "seats"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.availableSeats && (
                    <p className="text-sm text-destructive">
                      {errors.availableSeats}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Pricing</span>
              </h3>

              <div className="space-y-2">
                <Label htmlFor="pricePerDelivery">
                  Price per Delivery (GHC) *
                </Label>
                <Input
                  id="pricePerDelivery"
                  type="number"
                  min="1"
                  step="0.50"
                  placeholder="5.00"
                  value={formData.pricePerDelivery}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerDelivery: e.target.value,
                    })
                  }
                  className={
                    errors.pricePerDelivery ? "border-destructive" : ""
                  }
                />
                {errors.pricePerDelivery && (
                  <p className="text-sm text-destructive">
                    {errors.pricePerDelivery}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Suggested: GHC 3-8 for on-campus routes, GHC 8-15 for longer
                  distances
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>

              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Information</Label>
                <Input
                  id="contactInfo"
                  placeholder="Phone number or preferred contact method"
                  value={formData.contactInfo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your trip will be visible to verified students with delivery
                requests along your route. You'll be notified when someone wants
                to book a delivery.
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
                {isSubmitting ? "Posting Trip..." : "Post Trip"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
