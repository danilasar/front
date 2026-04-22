import api from "./axios.ts";
import type {
  AuthResponse,
  CompleteInvitationRegistrationRequest,
  CreateHackathonRequest,
  CreateOrganizerRequest,
  CreateTeamApplicationRequest,
  ExportFormat,
  FormField,
  FormFieldScope,
  Hackathon,
  Page,
  Team,
  TeamApplicationResponse,
  TeamStatus,
  TokenPair,
  UserProfile,
  Invitation,
} from "../domain/types";

export const authApi = {
  async login(data: { email: string; password: string }) {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async register(data: { email: string; password: string; fullName: string }) {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  async refresh(refreshToken: string) {
    const response = await api.post<TokenPair>("/auth/refresh", { refreshToken });
    return response.data;
  },

  async me() {
    const response = await api.get<UserProfile>("/users/me");
    return response.data;
  },
};

export const adminApi = {
  async listOrganizers() {
    const response = await api.get<Page<UserProfile>>("/admin/organizers");
    return response.data;
  },

  async createOrganizer(data: CreateOrganizerRequest) {
    const response = await api.post<UserProfile>("/admin/organizers", data);
    return response.data;
  },

  async assignOrganizer(hackathonId: string, organizerId: string) {
    await api.put(`/admin/hackathons/${hackathonId}/organizers/${organizerId}`);
  },
};

export const hackathonApi = {
  async list(status?: Hackathon["status"]) {
    const response = await api.get<Page<Hackathon>>("/hackathons", { params: { status } });
    return response.data;
  },

  async active() {
    const response = await api.get<Hackathon>("/hackathons/active");
    return response.data;
  },

  async get(id: string) {
    const response = await api.get<Hackathon>(`/hackathons/${id}`);
    return response.data;
  },

  async create(data: CreateHackathonRequest) {
    const response = await api.post<Hackathon>("/hackathons", data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateHackathonRequest>) {
    const response = await api.patch<Hackathon>(`/hackathons/${id}`, data);
    return response.data;
  },

  async activate(id: string) {
    const response = await api.post<Hackathon>(`/hackathons/${id}/activate`);
    return response.data;
  },

  async uploadRules(id: string, file: File) {
    const data = new FormData();
    data.append("file", file);
    const response = await api.put<Hackathon>(`/hackathons/${id}/rules`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async fields(id: string, scope?: FormFieldScope) {
    const response = await api.get<FormField[]>(`/hackathons/${id}/form-fields`, {
      params: { scope },
    });
    return response.data;
  },

  async createField(id: string, data: Omit<FormField, "id" | "hackathonId">) {
    const response = await api.post<FormField>(`/hackathons/${id}/form-fields`, data);
    return response.data;
  },

  async updateField(hackathonId: string, fieldId: string, data: Partial<Omit<FormField, "id" | "hackathonId">>) {
    const response = await api.patch<FormField>(`/hackathons/${hackathonId}/form-fields/${fieldId}`, data);
    return response.data;
  },

  async deleteField(hackathonId: string, fieldId: string) {
    await api.delete(`/hackathons/${hackathonId}/form-fields/${fieldId}`);
  },
};

export const teamApi = {
  async list(hackathonId: string, status?: TeamStatus) {
    const response = await api.get<Page<Team>>(`/hackathons/${hackathonId}/teams`, {
      params: { status },
    });
    return response.data;
  },

  async createApplication(hackathonId: string, data: CreateTeamApplicationRequest) {
    const response = await api.post<TeamApplicationResponse>(`/hackathons/${hackathonId}/teams`, data);
    return response.data;
  },

  async setStatus(hackathonId: string, teamId: string, status: TeamStatus, reason?: string) {
    const response = await api.patch<Team>(`/hackathons/${hackathonId}/teams/${teamId}/status`, {
      status,
      reason,
    });
    return response.data;
  },

  async disqualifyMember(hackathonId: string, teamId: string, memberId: string) {
    const response = await api.post<Team>(`/hackathons/${hackathonId}/teams/${teamId}/members/${memberId}/disqualify`);
    return response.data;
  },

  async exportTeams(hackathonId: string, format: ExportFormat) {
    const response = await api.get<Blob>(`/hackathons/${hackathonId}/exports/teams`, {
      params: { format },
      responseType: "blob",
    });
    return response.data;
  },
};

export const invitationApi = {
  async get(token: string) {
    const response = await api.get<Invitation>(`/invitations/${token}`);
    return response.data;
  },

  async acceptExisting(token: string) {
    const response = await api.post<Team>(`/invitations/${token}/accept-existing`);
    return response.data;
  },

  async completeRegistration(token: string, data: CompleteInvitationRegistrationRequest) {
    const response = await api.post<AuthResponse>(`/invitations/${token}/complete-registration`, data);
    return response.data;
  },
};
