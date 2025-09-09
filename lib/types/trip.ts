// KNUST Campus Locations
export const KNUST_CAMPUS_LOCATIONS = [
  "University Hall",
  "Unity Hall",
  "Africa Hall",
  "Queen Elizabeth II Hall",
  "Independence Hall",
  "Republic Hall",
  "Old Brunei",
  "New Brunei",
  "Complex",
  "Baby Brunei",
  "Hall 7",
  "College of Science",
  "College of Health Sciences",
  "College of Humanities and Social Sciences",
  "College of Engineering",
  "College of Agriculture and Natural Resources",
  "College of Art and Built Environment",
  "Casely-Hayford Building",
] as const;

export type CampusLocation = (typeof KNUST_CAMPUS_LOCATIONS)[number];

export interface ILocation {
  type: "campus" | "off-campus";
  campusLocation?: CampusLocation;
  offCampusAddress?: string;
}

export interface ITrip {
  travelerId: string;
  fromLocation: ILocation;
  toLocation: ILocation;
  departureTime: Date;
  transportMethod: string;
  maxDeliveries: number;
  currentDeliveries: number;
  pricePerDelivery: number; // Price in Ghana Cedi (GHC)
  isRecurring: boolean;
  status: "active" | "completed" | "cancelled";
  matchedRequests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeliveryRequest {
  userId: string;
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  itemDescription: string;
  itemSize: "Small" | "Medium" | "Large";
  priority: "normal" | "high" | "urgent";
  paymentAmount: number; // Payment in Ghana Cedi (GHC)
  pickupDate: Date;
  pickupTime: string;
  contactInfo: string;
  specialInstructions: string;
  status: "pending" | "matched" | "in-transit" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}
