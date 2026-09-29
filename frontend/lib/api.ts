export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
  }
}

type SessionListener = (reason: "expired" | "blocked", message: string) => void;
let sessionListener: SessionListener | null = null;
/** The app registers one listener that signs the user out when their session dies. */
export function onSessionEnded(listener: SessionListener) {
  sessionListener = listener;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body !== undefined && { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach Housify right now. Check your connection and try again.", 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error ?? "Request failed.";
    if (token && res.status === 401) sessionListener?.("expired", message);
    if (token && res.status === 403 && data.code === "ACCOUNT_BLOCKED") sessionListener?.("blocked", message);
    throw new ApiError(message, res.status, data.code);
  }
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body !== undefined && { body: JSON.stringify(body) }),
});

/* ───────── Auth & profile ───────── */

export type Role = "user" | "landlord" | "agent" | "realtor" | "admin";
export type PublicRole = Exclude<Role, "admin">;
export type AccountStatus = "active" | "suspended" | "deactivated";

export interface MeUser {
  id: string;
  role: Role;
  name: string;
  email?: string;
  username?: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  states: string[];
  areasCovered: string[];
  experience?: string;
  verified: boolean;
  status: AccountStatus;
  avatarUrl?: string | null;
  createdAt: string;
}

export function login(identifier: string, password: string) {
  return apiFetch<{ token: string; user: MeUser }>("/auth/login", json("POST", { identifier, password }));
}

export interface RegisterInput {
  role: PublicRole;
  name: string;
  email: string;
  password: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  states?: string[];
  areasCovered?: string[];
  experience?: string;
}

export function register(input: RegisterInput) {
  return apiFetch<{ token: string; user: MeUser }>("/auth/register", json("POST", input));
}

export function getMe(token: string) {
  return apiFetch<{ user: MeUser }>("/auth/me", {}, token);
}

export type ProfilePatch = Partial<{
  name: string;
  username: string;
  email: string;
  phone: string;
  whatsapp: string;
  bio: string;
  states: string[];
  areasCovered: string[];
  experience: string;
  /** An uploaded avatar URL, or "" to remove it. */
  avatarUrl: string;
}>;

export function updateMe(token: string, patch: ProfilePatch) {
  return apiFetch<{ user: MeUser }>("/auth/me", json("PATCH", patch), token);
}

/** Also signs out every other device; returns a fresh token for this one. */
export function changePassword(token: string, currentPassword: string, newPassword: string) {
  return apiFetch<{ ok: boolean; token: string }>("/auth/me/password", json("PATCH", { currentPassword, newPassword }), token);
}

export function requestPasswordReset(email: string) {
  return apiFetch<{ ok: boolean; message: string }>("/auth/forgot-password", json("POST", { email }));
}

export function checkResetToken(token: string) {
  return apiFetch<{ ok: boolean; email: string | null; expiresAt: string }>("/auth/reset-password/check", json("POST", { token }));
}

export function resetPassword(token: string, password: string) {
  return apiFetch<{ ok: boolean }>("/auth/reset-password", json("POST", { token, password }));
}

export function deactivateAccount(token: string, password: string) {
  return apiFetch<{ ok: boolean }>("/auth/me/deactivate", json("POST", { password }), token);
}

/* ───────── Listings ───────── */

export type ListingStatus = "active" | "paused" | "pending" | "removed";
export type PropertyType = "apartment" | "house" | "duplex" | "land" | "commercial" | "shortlet" | "other";

export interface ListingOwner {
  id: string;
  name: string;
  role: Role;
  verified: boolean;
  avatarUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  bio?: string | null;
  memberSince?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  type: "rent" | "sale";
  propertyType: PropertyType;
  furnished: boolean;
  address: string;
  location: string;
  price: { currency: string; amount: number };
  negotiable: boolean;
  beds: number;
  baths: number;
  sqft: number;
  amenities: string[];
  photos: string[];
  videos: string[];
  availabilityDates: string[];
  status: ListingStatus;
  moderationNote: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: ListingOwner | null;
}

export interface ListingInput {
  title: string;
  description: string;
  type: "rent" | "sale";
  propertyType: PropertyType;
  furnished: boolean;
  address: string;
  location: string;
  price: { currency: string; amount: number };
  negotiable: boolean;
  beds: number;
  baths: number;
  sqft: number;
  amenities: string[];
  photos: string[];
  videos: string[];
  availabilityDates: string[];
}

export interface ListingQuery {
  q?: string;
  type?: "rent" | "sale";
  propertyType?: PropertyType;
  furnished?: boolean;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export function searchListings(query: ListingQuery = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params.set(k, String(v));
  return apiFetch<{ items: Listing[]; total: number; page: number; pageSize: number }>(`/listings?${params}`);
}

export function getListing(id: string, token?: string | null) {
  return apiFetch<{ listing: Listing }>(`/listings/${id}`, {}, token);
}

export function createListing(token: string, input: Partial<ListingInput>) {
  return apiFetch<{ listing: Listing }>("/listings", json("POST", input), token);
}

export function updateListing(token: string, id: string, patch: Partial<ListingInput>) {
  return apiFetch<{ listing: Listing }>(`/listings/${id}`, json("PATCH", patch), token);
}

export function getMyListings(token: string) {
  return apiFetch<Listing[]>("/listings/mine", {}, token);
}

export function updateListingStatus(token: string, id: string, status: "active" | "paused") {
  return apiFetch<{ listing: Listing }>(`/listings/${id}/status`, json("PATCH", { status }), token);
}

export function deleteListing(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(`/listings/${id}`, json("DELETE"), token);
}

/* ───────── Inquiries ───────── */

export type InquiryStatus = "new" | "contacted" | "viewing_scheduled" | "closed" | "declined";

export interface Inquiry {
  id: string;
  listingId: string;
  listing: { id: string; title: string; location: string; photo: string | null; type: "rent" | "sale"; price: { currency: string; amount: number } } | null;
  name: string;
  email?: string;
  phone?: string;
  requestedDate: string | null;
  message: string | null;
  status: InquiryStatus;
  ownerNote: string | null;
  owner?: { id: string; name: string; role: Role; verified: boolean } | null;
  createdAt: string;
  updatedAt: string;
}

export function sendInquiry(
  listingId: string,
  input: { name: string; email: string; phone: string; requestedDate?: string; message?: string },
  token?: string | null
) {
  return apiFetch<{ inquiry: Inquiry }>(`/listings/${listingId}/inquiries`, json("POST", input), token);
}

export function getReceivedInquiries(token: string) {
  return apiFetch<Inquiry[]>("/inquiries/received", {}, token);
}

export function getSentInquiries(token: string) {
  return apiFetch<Inquiry[]>("/inquiries/sent", {}, token);
}

export function updateInquiry(token: string, id: string, patch: { status?: InquiryStatus; ownerNote?: string }) {
  return apiFetch<{ inquiry: Inquiry }>(`/inquiries/${id}`, json("PATCH", patch), token);
}

/* ───────── Agent requests ───────── */

export type AgentRequestStatus = "new" | "accepted" | "declined" | "closed";

export interface AgentRequest {
  id: string;
  name: string;
  contact: string | null;
  area: string;
  lookingFor: string | null;
  budget: string | null;
  status: AgentRequestStatus;
  agentNote: string | null;
  agent: { id: string; name: string; verified: boolean } | null;
  assigned: boolean;
  createdAt: string;
  updatedAt: string;
}

export function sendAgentRequest(
  input: { name: string; contact: string; area: string; lookingFor?: string; budget?: string; agentId?: string },
  token?: string | null
) {
  return apiFetch<{ request: AgentRequest }>("/agent-requests", json("POST", input), token);
}

export function getIncomingAgentRequests(token: string) {
  return apiFetch<AgentRequest[]>("/agent-requests/incoming", {}, token);
}

export function getMyAgentRequests(token: string) {
  return apiFetch<AgentRequest[]>("/agent-requests/mine", {}, token);
}

export function updateAgentRequest(token: string, id: string, patch: { status?: AgentRequestStatus; agentNote?: string }) {
  return apiFetch<{ request: AgentRequest }>(`/agent-requests/${id}`, json("PATCH", patch), token);
}

/* ───────── Favorites ───────── */

export interface SavedListing {
  savedAt: string;
  available: boolean;
  listing: Listing;
}

export function getFavorites(token: string) {
  return apiFetch<SavedListing[]>("/me/favorites", {}, token);
}

export function getFavoriteIds(token: string) {
  return apiFetch<string[]>("/me/favorites/ids", {}, token);
}

export function saveListing(token: string, listingId: string) {
  return apiFetch<{ ok: boolean }>(`/me/favorites/${listingId}`, json("PUT"), token);
}

export function unsaveListing(token: string, listingId: string) {
  return apiFetch<{ ok: boolean }>(`/me/favorites/${listingId}`, json("DELETE"), token);
}

/* ───────── Notifications ───────── */

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function getNotifications(token: string) {
  return apiFetch<{ items: AppNotification[]; unread: number }>("/notifications", {}, token);
}

export function markNotificationRead(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(`/notifications/${id}/read`, json("POST"), token);
}

export function markAllNotificationsRead(token: string) {
  return apiFetch<{ ok: boolean }>("/notifications/read-all", json("POST"), token);
}

/* ───────── Reports ───────── */

export type ReportCategory = "listing" | "landlord" | "agent" | "realtor" | "user" | "complaint" | "query" | "suspicious_activity";
export type ReportStatus = "open" | "under_review" | "resolved" | "rejected";

export interface Report {
  id: string;
  category: ReportCategory;
  subject: string;
  message: string;
  status: ReportStatus;
  resolution: string | null;
  targetListing: { id: string; title?: string; status?: ListingStatus } | null;
  targetUser: { id: string; name?: string; role?: Role; status?: AccountStatus } | null;
  reporter: { id: string; name: string; role: Role; email?: string } | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportInput {
  category: ReportCategory;
  subject: string;
  message: string;
  targetListingId?: string;
  targetUserId?: string;
}

export function submitReport(token: string, input: ReportInput) {
  return apiFetch<{ report: Report }>("/reports", json("POST", input), token);
}

export function getMyReports(token: string) {
  return apiFetch<Report[]>("/reports/mine", {}, token);
}

/* ───────── Admin ───────── */

export interface AdminStats {
  totalListings: number;
  activeListings: number;
  pausedListings: number;
  pendingListings: number;
  removedListings: number;
  totalLandlords: number;
  totalAgents: number;
  totalRealtors: number;
  totalMembers: number;
  totalUsers: number;
  pendingApprovals: number;
  suspendedAccounts: number;
  openReports: number;
  reviewingReports: number;
  totalInquiries: number;
  totalAgentRequests: number;
}

export function getAdminStats(token: string) {
  return apiFetch<AdminStats>("/admin/stats", {}, token);
}

export interface AdminPerson {
  id: string;
  name: string;
  avatarUrl?: string | null;
  email?: string;
  phone: string;
  verified: boolean;
  status: AccountStatus;
  createdAt: string;
  listingCount?: number;
  areasCovered?: string[];
}

export const getAdminMembers = (token: string) => apiFetch<AdminPerson[]>("/admin/users", {}, token);
export const getAdminLandlords = (token: string) => apiFetch<AdminPerson[]>("/admin/landlords", {}, token);
export const getAdminAgents = (token: string) => apiFetch<AdminPerson[]>("/admin/agents", {}, token);
export const getAdminRealtors = (token: string) => apiFetch<AdminPerson[]>("/admin/realtors", {}, token);

export interface AdminPersonDetail {
  person: MeUser & { statusReason: string | null; statusChangedAt: string | null };
  listings: Listing[];
  reportsAgainst: Report[];
  counts: { reportsFiled: number; inquiriesReceived: number; inquiriesSent: number };
}

export function getAdminPerson(token: string, id: string) {
  return apiFetch<AdminPersonDetail>(`/admin/people/${id}`, {}, token);
}

export function setAccountStatus(token: string, id: string, status: AccountStatus, reason?: string) {
  return apiFetch<{ person: AdminPerson }>(`/admin/people/${id}/status`, json("PATCH", { status, reason }), token);
}

export function setVerification(token: string, id: string, verified: boolean) {
  return apiFetch<{ person: AdminPerson }>(`/admin/people/${id}/verification`, json("PATCH", { verified }), token);
}

export interface AdminListing {
  id: string;
  title: string;
  address: string;
  location: string;
  type: "rent" | "sale";
  price: { currency: string; amount: number };
  beds: number;
  baths: number;
  photo: string | null;
  status: ListingStatus;
  moderationNote: string | null;
  landlordName: string;
  ownerId: string | null;
  ownerRole: Role | null;
  createdAt: string;
}

export function getAdminListings(token: string) {
  return apiFetch<AdminListing[]>("/admin/listings", {}, token);
}

export function moderateListing(token: string, id: string, status: "active" | "paused" | "removed", note?: string) {
  return apiFetch<{ listing: Listing }>(`/admin/listings/${id}/status`, json("PATCH", { status, note }), token);
}

export function getAdminReports(token: string, status?: ReportStatus) {
  return apiFetch<Report[]>(`/admin/reports${status ? `?status=${status}` : ""}`, {}, token);
}

export function updateReport(token: string, id: string, status: ReportStatus, resolution?: string) {
  return apiFetch<{ report: Report }>(`/admin/reports/${id}`, json("PATCH", { status, resolution }), token);
}

export interface AdminActivity {
  inquiries: { id: string; from: string; listingTitle: string; ownerName: string; status: InquiryStatus; createdAt: string }[];
  agentRequests: { id: string; from: string; area: string; agentName: string | null; status: AgentRequestStatus; createdAt: string }[];
}

export function getAdminActivity(token: string) {
  return apiFetch<AdminActivity>("/admin/activity", {}, token);
}

/* ───────── Public ───────── */

export interface PublicStats {
  liveListings: number;
  verifiedProfessionals: number;
  areas: number;
}

export function getPublicStats() {
  return apiFetch<PublicStats>("/public/stats");
}

export interface Professional {
  id: string;
  role: "landlord" | "agent" | "realtor";
  name: string;
  bio: string | null;
  verified: boolean;
  avatarUrl?: string | null;
  states: string[];
  areasCovered: string[];
  experience: string | null;
  memberSince: string;
  liveListings: number;
  phone?: string | null;
  whatsapp?: string | null;
}

export function searchProfessionals(query: { role?: string; q?: string; area?: string; verified?: boolean; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params.set(k, String(v));
  return apiFetch<{ items: Professional[]; total: number; page: number; pageSize: number }>(`/professionals?${params}`);
}

export function getProfessional(id: string) {
  return apiFetch<{ profile: Professional; listings: Listing[] }>(`/professionals/${id}`);
}

/* ───────── Uploads ───────── */

export type UploadKind = "listing-photo" | "listing-video" | "avatar";

export interface UploadedFile {
  id: string;
  kind: UploadKind;
  url: string;
  contentType: string;
  bytes: number;
  width: number | null;
  height: number | null;
}

/**
 * Uploads one file. Uses XMLHttpRequest rather than fetch because fetch can't
 * report upload progress. `signal` cancels the upload.
 */
export function uploadFile(
  token: string,
  kind: UploadKind,
  file: File,
  opts: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/uploads?kind=${kind}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let data: { upload?: UploadedFile; error?: string; code?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.upload) return resolve(data.upload);
      if (xhr.status === 401) sessionListener?.("expired", data.error ?? "Session expired.");
      if (xhr.status === 403 && data.code === "ACCOUNT_BLOCKED") sessionListener?.("blocked", data.error ?? "Account blocked.");
      reject(new ApiError(data.error ?? (xhr.status === 413 ? "That file is too large." : "Upload failed."), xhr.status, data.code));
    };
    xhr.onerror = () => reject(new ApiError("Upload failed. Check your connection and try again.", 0));
    xhr.onabort = () => reject(new ApiError("Upload cancelled.", 0, "ABORTED"));
    opts.signal?.addEventListener("abort", () => xhr.abort());
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function deleteUpload(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(`/uploads/${id}`, json("DELETE"), token);
}
