export type Role = "member" | "admin";

export type ValidationStatus =
  | "pending"
  | "validated"
  | "rejected"
  | "needs_correction";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  orcid_name_locked: boolean;
}

export interface AdminUser extends User {
  orcid_id: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ResearchAxis {
  id: number;
  title: string;
  description: string;
  lead_member_name: string | null;
}

export interface MemberProfile {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  role: Role;
  photo_url: string | null;
  grade: string | null;
  specialty: string | null;
  team: string | null;
  biography: string | null;
  interests: string | null;
  external_links: string | null;
  orcid_id: string | null;
  laboratory: string;
  research_axis_id: number | null;
  research_axis_title: string | null;
  publication_count: number;
  updated_at: string;
}

export interface Publication {
  id: number;
  title: string;
  authors: string;
  publication_type: string;
  year: number;
  venue: string | null;
  abstract: string | null;
  keywords: string | null;
  doi: string | null;
  external_link: string | null;
  pdf_url: string | null;
  axis_id: number | null;
  project_id: number | null;
  source: string;
  validation_status: ValidationStatus;
  owner_id: number;
  owner_name: string;
  axis_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: number;
  title: string;
  authors: string;
  event_name: string;
  communication_type: string;
  location: string | null;
  country: string | null;
  event_date: string | null;
  abstract: string | null;
  presentation_status: "submitted" | "accepted" | "presented";
  document_url: string | null;
  axis_id: number | null;
  validation_status: ValidationStatus;
  owner_id: number;
  owner_name: string;
  axis_title: string | null;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  summary: string;
  lead_member_name: string | null;
  partners: string | null;
  start_date: string | null;
  end_date: string | null;
  funding: string | null;
  status: string;
  is_public: boolean;
  axis_id: number | null;
  validation_status: ValidationStatus;
  created_by: number;
  owner_name: string;
  axis_title: string | null;
  created_at: string;
}

export interface LabEvent {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  location: string;
  program: string | null;
  speakers: string | null;
  visual_url: string | null;
  lifecycle_status: "upcoming" | "past";
  registration_link: string | null;
  is_public: boolean;
  axis_id: number | null;
  validation_status: ValidationStatus;
  created_by: number;
  owner_name: string;
  axis_title: string | null;
  created_at: string;
}

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  category: string | null;
  image_url: string | null;
  is_published: boolean;
  validation_status: ValidationStatus;
  author_id: number;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  image_url: string;
  caption: string | null;
  category: string | null;
  is_published: boolean;
  author_id: number;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStat {
  label: string;
  value: number;
  trend: string;
}

export interface ActivityItem {
  id: number;
  action: string;
  title: string;
  date: string;
  status: "success" | "pending" | "warning";
  user?: string | null;
}

export interface MemberDashboard {
  stats: DashboardStat[];
  publication_trend: { year: string; count: number }[];
  recent_activities: ActivityItem[];
}

export interface AdminDashboard {
  stats: DashboardStat[];
  submission_trend: { month: string; validations: number; submissions: number }[];
  recent_activities: ActivityItem[];
}

export interface ModerationQueueItem {
  content_type: "publication" | "communication" | "project" | "event" | "news";
  item_id: number;
  title: string;
  author_name: string;
  created_at: string;
  status: ValidationStatus;
}

export interface PublicationChangeRequest {
  id: number;
  publication_id: number;
  publication_title: string;
  owner_id: number;
  owner_name: string;
  request_type: "edit" | "delete";
  new_data: string | null;
  status: "pending" | "approved" | "rejected";
  admin_comment: string | null;
  created_at: string;
}

export interface MemberNotification {
  id: number;
  title: string;
  message: string;
  category: "success" | "warning" | "danger" | "info" | string;
  content_type: string | null;
  content_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface ValidationTimelineItem {
  id: string;
  content_type: "publication" | "communication" | "project" | string;
  content_id: number;
  title: string;
  event: string;
  status: ValidationStatus;
  comment: string | null;
  actor_name: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id: number;
  actor_email: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_title: string | null;
  details: string | null;
  created_at: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toQueryString(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : "Une erreur est survenue lors de la requete";
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function requestPasswordReset(email: string): Promise<{
  message: string;
  reset_url: string | null;
}> {
  return request<{ message: string; reset_url: string | null }>("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export async function register(
  full_name: string,
  email: string,
  password: string,
  orcid_id?: string,
): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, password, orcid_id: orcid_id || undefined }),
  });
}

export interface OrcidPreview {
  orcid_id: string;
  full_name: string | null;
  biography: string | null;
  works: { title: string; publication_type: string; year: number | null; venue: string | null; doi: string | null }[];
}

export async function lookupOrcid(orcidId: string): Promise<OrcidPreview> {
  return request<OrcidPreview>(`/orcid/${orcidId}/preview`);
}

export async function completeOrcidSetup(payload: {
  orcid_id: string;
  orcid_name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/orcid/complete-setup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(token: string): Promise<User> {
  return request<User>("/auth/me", {}, token);
}

export async function listMembers(params?: {
  search?: string;
  axis_id?: number;
  role?: Role;
}): Promise<MemberProfile[]> {
  const query = toQueryString({
    search: params?.search,
    axis_id: params?.axis_id,
    role: params?.role,
  });
  const path = query ? `/members?${query}` : "/members";
  return request<MemberProfile[]>(path);
}

export async function getMember(profileId: number): Promise<MemberProfile> {
  return request<MemberProfile>(`/members/${profileId}`);
}

export async function getMyProfile(token: string): Promise<MemberProfile> {
  return request<MemberProfile>("/members/me/profile", {}, token);
}

export async function listMyNotifications(
  token: string,
  unreadOnly = false,
): Promise<MemberNotification[]> {
  const query = unreadOnly ? "?unread_only=true" : "";
  return request<MemberNotification[]>(`/members/me/notifications${query}`, {}, token);
}

export async function markNotificationRead(
  token: string,
  notificationId: number,
): Promise<MemberNotification> {
  return request<MemberNotification>(
    `/members/me/notifications/${notificationId}/read`,
    { method: "POST" },
    token,
  );
}

export async function markAllNotificationsRead(token: string): Promise<{ updated: number }> {
  return request<{ updated: number }>(
    "/members/me/notifications/read-all",
    { method: "POST" },
    token,
  );
}

export async function listMyValidationTimeline(token: string): Promise<ValidationTimelineItem[]> {
  return request<ValidationTimelineItem[]>("/members/me/validation-timeline", {}, token);
}

export async function updateMyProfile(
  token: string,
  payload: Partial<MemberProfile> & { full_name?: string },
): Promise<MemberProfile> {
  return request<MemberProfile>(
    "/members/me/profile",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function listAxes(): Promise<ResearchAxis[]> {
  return request<ResearchAxis[]>("/axes");
}

export async function createAxis(
  token: string,
  payload: {
    title: string;
    description: string;
    lead_member_name?: string | null;
  },
): Promise<ResearchAxis> {
  return request<ResearchAxis>(
    "/axes",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateAxis(
  token: string,
  axisId: number,
  payload: {
    title?: string;
    description?: string;
    lead_member_name?: string | null;
  },
): Promise<ResearchAxis> {
  return request<ResearchAxis>(
    `/axes/${axisId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteAxis(token: string, axisId: number): Promise<void> {
  return request<void>(`/axes/${axisId}`, { method: "DELETE" }, token);
}

export async function listPublications(params?: {
  search?: string;
  year?: number;
  axis_id?: number;
  owner_id?: number;
  publication_type?: string;
  source?: string;
}): Promise<Publication[]> {
  const query = toQueryString({
    search: params?.search,
    year: params?.year,
    axis_id: params?.axis_id,
    owner_id: params?.owner_id,
    publication_type: params?.publication_type,
    source: params?.source,
  });
  const path = query ? `/publications?${query}` : "/publications";
  return request<Publication[]>(path);
}

export async function getPublication(publicationId: number): Promise<Publication> {
  return request<Publication>(`/publications/${publicationId}`);
}

export async function listMyPublications(token: string): Promise<Publication[]> {
  return request<Publication[]>("/publications/me", {}, token);
}

export async function requestEditPublication(
  token: string,
  publicationId: number,
  payload: {
    title?: string;
    authors?: string;
    publication_type?: string;
    year?: number;
    venue?: string;
    abstract?: string;
    keywords?: string;
    doi?: string;
    external_link?: string;
    axis_id?: number | null;
  },
): Promise<PublicationChangeRequest> {
  return request<PublicationChangeRequest>(
    `/publications/${publicationId}/request-edit`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function requestDeletePublication(
  token: string,
  publicationId: number,
): Promise<PublicationChangeRequest> {
  return request<PublicationChangeRequest>(
    `/publications/${publicationId}/request-delete`,
    { method: "POST" },
    token,
  );
}

export async function listMyChangeRequests(token: string): Promise<PublicationChangeRequest[]> {
  return request<PublicationChangeRequest[]>("/publications/me/change-requests", {}, token);
}

export async function listModerationChangeRequests(token: string): Promise<PublicationChangeRequest[]> {
  return request<PublicationChangeRequest[]>("/moderation/change-requests", {}, token);
}

export async function decideChangeRequest(
  token: string,
  requestId: number,
  decision: "approved" | "rejected",
  comment?: string,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/moderation/change-requests/${requestId}/decision`,
    { method: "POST", body: JSON.stringify({ decision, comment }) },
    token,
  );
}

export async function createPublication(
  token: string,
  payload: {
    title: string;
    authors: string;
    publication_type: string;
    year: number;
    venue?: string;
    abstract?: string;
    keywords?: string;
    doi?: string;
    external_link?: string;
    pdf_url?: string;
    axis_id?: number | null;
    project_id?: number | null;
  },
): Promise<Publication> {
  return request<Publication>(
    "/publications",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function listMyCommunications(token: string): Promise<Communication[]> {
  return request<Communication[]>("/communications/me", {}, token);
}

export async function createCommunication(
  token: string,
  payload: {
    title: string;
    authors: string;
    event_name: string;
    communication_type: string;
    location?: string;
    country?: string;
    event_date?: string;
    abstract?: string;
    presentation_status?: "submitted" | "accepted" | "presented";
    document_url?: string;
    axis_id?: number | null;
  },
): Promise<Communication> {
  return request<Communication>(
    "/communications",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getMemberDashboard(token: string): Promise<MemberDashboard> {
  return request<MemberDashboard>("/dashboard/member", {}, token);
}

export async function getAdminDashboard(token: string): Promise<AdminDashboard> {
  return request<AdminDashboard>("/dashboard/admin", {}, token);
}

export async function listModerationQueue(token: string): Promise<ModerationQueueItem[]> {
  return request<ModerationQueueItem[]>("/moderation/queue", {}, token);
}

export async function moderateItem(
  token: string,
  contentType: ModerationQueueItem["content_type"],
  itemId: number,
  decision: ValidationStatus,
  comment?: string,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/moderation/${contentType}/${itemId}/decision`,
    {
      method: "POST",
      body: JSON.stringify({ decision, comment }),
    },
    token,
  );
}

export async function linkOrcid(token: string, orcidId: string): Promise<MemberProfile> {
  return request<MemberProfile>(
    "/orcid/link",
    {
      method: "POST",
      body: JSON.stringify({ orcid_id: orcidId }),
    },
    token,
  );
}

export async function importOrcidPublications(
  token: string,
  orcidId?: string,
): Promise<{ imported: number; skipped: number; message: string }> {
  return request<{ imported: number; skipped: number; message: string }>(
    "/orcid/import-publications",
    {
      method: "POST",
      body: JSON.stringify({ orcid_id: orcidId }),
    },
    token,
  );
}

export async function listProjects(): Promise<Project[]> {
  return request<Project[]>("/projects");
}

export async function listAdminProjects(token: string): Promise<Project[]> {
  return request<Project[]>("/projects?include_all=true", {}, token);
}

export async function listMyProjects(token: string): Promise<Project[]> {
  return request<Project[]>("/projects/me", {}, token);
}

export async function createProject(
  token: string,
  payload: {
    title: string;
    summary: string;
    lead_member_name?: string;
    partners?: string;
    start_date?: string;
    end_date?: string;
    funding?: string;
    status?: string;
    is_public?: boolean;
    axis_id?: number | null;
  },
): Promise<Project> {
  return request<Project>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateProject(
  token: string,
  projectId: number,
  payload: {
    title?: string;
    summary?: string;
    lead_member_name?: string | null;
    partners?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    funding?: string | null;
    status?: string;
    is_public?: boolean;
    axis_id?: number | null;
  },
): Promise<Project> {
  return request<Project>(
    `/projects/${projectId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteProject(token: string, projectId: number): Promise<void> {
  return request<void>(`/projects/${projectId}`, { method: "DELETE" }, token);
}

export async function listEvents(): Promise<LabEvent[]> {
  return request<LabEvent[]>("/events");
}

export async function listAdminEvents(token: string): Promise<LabEvent[]> {
  return request<LabEvent[]>("/events?include_all=true", {}, token);
}

export async function createEvent(
  token: string,
  payload: {
    title: string;
    description: string;
    event_type: string;
    start_date: string;
    end_date?: string | null;
    location: string;
    program?: string;
    speakers?: string;
    visual_url?: string;
    lifecycle_status?: "upcoming" | "past";
    registration_link?: string;
    is_public?: boolean;
    axis_id?: number | null;
  },
): Promise<LabEvent> {
  return request<LabEvent>(
    "/events",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateEvent(
  token: string,
  eventId: number,
  payload: {
    title?: string;
    description?: string;
    event_type?: string;
    start_date?: string;
    end_date?: string | null;
    location?: string;
    program?: string;
    speakers?: string;
    visual_url?: string;
    lifecycle_status?: "upcoming" | "past";
    registration_link?: string | null;
    is_public?: boolean;
    axis_id?: number | null;
  },
): Promise<LabEvent> {
  return request<LabEvent>(
    `/events/${eventId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteEvent(token: string, eventId: number): Promise<void> {
  return request<void>(`/events/${eventId}`, { method: "DELETE" }, token);
}

export async function listAdminNews(token: string): Promise<NewsItem[]> {
  return request<NewsItem[]>("/news?include_all=true", {}, token);
}

export async function listNews(): Promise<NewsItem[]> {
  return request<NewsItem[]>("/news");
}

export async function submitContactMessage(payload: {
  first_name: string;
  last_name: string;
  email: string;
  message: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createNews(
  token: string,
  payload: {
    title: string;
    content: string;
    category?: string;
    image_url?: string;
    is_published?: boolean;
  },
): Promise<NewsItem> {
  return request<NewsItem>(
    "/news",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateNews(
  token: string,
  newsId: number,
  payload: {
    title?: string;
    content?: string;
    category?: string | null;
    image_url?: string | null;
    is_published?: boolean;
  },
): Promise<NewsItem> {
  return request<NewsItem>(
    `/news/${newsId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteNews(token: string, newsId: number): Promise<void> {
  return request<void>(`/news/${newsId}`, { method: "DELETE" }, token);
}

export async function listGalleryItems(): Promise<GalleryItem[]> {
  return request<GalleryItem[]>("/gallery");
}

export async function listAdminGalleryItems(token: string): Promise<GalleryItem[]> {
  return request<GalleryItem[]>("/gallery?include_unpublished=true", {}, token);
}

export async function createGalleryItem(
  token: string,
  payload: {
    title: string;
    image_url: string;
    caption?: string | null;
    category?: string | null;
    is_published?: boolean;
  },
): Promise<GalleryItem> {
  return request<GalleryItem>(
    "/gallery",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateGalleryItem(
  token: string,
  itemId: number,
  payload: {
    title?: string;
    image_url?: string;
    caption?: string | null;
    category?: string | null;
    is_published?: boolean;
  },
): Promise<GalleryItem> {
  return request<GalleryItem>(
    `/gallery/${itemId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteGalleryItem(token: string, itemId: number): Promise<void> {
  return request<void>(`/gallery/${itemId}`, { method: "DELETE" }, token);
}

export async function listAdminUsers(token: string): Promise<AdminUser[]> {
  return request<AdminUser[]>("/members/admin/users", {}, token);
}

export async function listAuditLogs(
  token: string,
  params?: {
    action?: string;
    entity_type?: string;
    limit?: number;
  },
): Promise<AuditLog[]> {
  const query = toQueryString({
    action: params?.action,
    entity_type: params?.entity_type,
    limit: params?.limit,
  });
  const path = query ? `/audit/logs?${query}` : "/audit/logs";
  return request<AuditLog[]>(path, {}, token);
}

export async function updateUserRole(
  token: string,
  userId: number,
  role: Role,
): Promise<User> {
  return request<User>(`/members/admin/users/${userId}/role?role=${role}`, { method: "PATCH" }, token);
}

export async function updateAdminUserOrcid(
  token: string,
  userId: number,
  orcidId: string | null,
): Promise<AdminUser> {
  return request<AdminUser>(
    `/members/admin/users/${userId}/orcid`,
    {
      method: "PATCH",
      body: JSON.stringify({ orcid_id: orcidId }),
    },
    token,
  );
}

export async function downloadMyPublicationsCsv(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/exports/my-publications.csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, "Impossible de telecharger le CSV");
  }

  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "my-publications.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
