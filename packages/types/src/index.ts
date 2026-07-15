export type UserRole = "landlord" | "agent";

export interface Money {
  currency: string;
  amount: number;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  bio?: string;
  verified: boolean;
  avatarUrl?: string;
  /** Agent-only fields */
  areasCovered?: string[];
  experience?: string;
  createdAt: string;
  updatedAt: string;
}

export type ListingType = "rent" | "sale";

export interface Listing {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  type: ListingType;
  address: string;
  location: string;
  price: Money;
  negotiable: boolean;
  beds: number;
  baths: number;
  sqft: number;
  photos: string[];
  videos?: string[];
  availabilityDates: string[];
  status: "active" | "paused" | "pending" | "removed";
  createdAt: string;
  updatedAt: string;
}

export type InquiryStatus = "new" | "confirmed" | "declined";

export interface Inquiry {
  id: string;
  listingId: string;
  landlordId: string;
  name: string;
  email: string;
  phone: string;
  requestedDate?: string;
  message?: string;
  status: InquiryStatus;
  createdAt: string;
}

export type AgentRequestStatus = "new" | "contacted" | "closed";

export interface AgentRequest {
  id: string;
  agentId?: string | null;
  name: string;
  contact: string;
  area: string;
  lookingFor?: string;
  status: AgentRequestStatus;
  createdAt: string;
}
