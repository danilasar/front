import type { Hackathon, ID, Role, UserProfile } from "./types";

export type AccessDecision = {
  allowed: boolean;
  reason: string;
};

export const canCreateHackathon = (role: Role | undefined): boolean => role === "admin";

export const canManageOutsideHackathon = (role: Role | undefined): boolean => role === "admin";

export const isAssignedOrganizer = (
  user: Pick<UserProfile, "id" | "role"> | null,
  hackathon: Pick<Hackathon, "organizerIds"> | null,
): boolean => {
  if (!user || !hackathon) return false;
  if (user.role !== "admin" && user.role !== "organizer") return false;
  return hackathon.organizerIds.includes(user.id);
};

export const explainHackathonManagementAccess = (
  user: Pick<UserProfile, "id" | "role"> | null,
  hackathon: Pick<Hackathon, "organizerIds"> | null,
): AccessDecision => {
  if (!user) {
    return { allowed: false, reason: "Нужно войти в аккаунт" };
  }

  if (user.role === "participant") {
    return { allowed: false, reason: "Участник не управляет хакатонами" };
  }

  if (!hackathon) {
    return { allowed: false, reason: "Хакатон не найден" };
  }

  if (!isAssignedOrganizer(user, hackathon)) {
    return {
      allowed: false,
      reason: "Пользователь не назначен организатором этого хакатона",
    };
  }

  return { allowed: true, reason: "Пользователь назначен организатором хакатона" };
};

export const uniqueIds = (ids: ID[]): ID[] => [...new Set(ids)];
