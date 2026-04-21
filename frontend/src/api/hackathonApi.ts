import api from "./axios";
import type {
  AuthResponse,
  CreateHackathonRequest,
  CreateOrganizerRequest,
  CreateTeamApplicationRequest,
  FormField,
  Hackathon,
  Page,
  Team,
  TeamApplicationResponse,
  TeamStatus,
  TokenPair,
  UserProfile,
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

  async fields(id: string, scope?: string) {
    const response = await api.get<FormField[]>(`/hackathons/${id}/form-fields`, {
      params: { scope },
    });
    return response.data;
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
};
