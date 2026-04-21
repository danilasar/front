import type { Team, TeamMember, TeamStatus } from "./types";

export type TeamStatusFilter = TeamStatus | "all";

export const teamStatusOptions: Array<{ value: TeamStatusFilter; label: string }> = [
  { value: "all", label: "Все статусы" },
  { value: "submitted", label: "На рассмотрении" },
  { value: "admitted", label: "Допущены" },
  { value: "rejected", label: "Отклонены" },
  { value: "disqualified", label: "Дисквалифицированы" },
  { value: "withdrawn", label: "Сняты" },
  { value: "draft", label: "Черновики" },
];

export const teamStatusLabels: Record<TeamStatus, string> = {
  draft: "Черновик",
  submitted: "На рассмотрении",
  admitted: "Допущена",
  rejected: "Отклонена",
  disqualified: "Дисквалифицирована",
  withdrawn: "Снята",
};

export const teamMemberStatusLabels: Record<TeamMember["status"], string> = {
  active: "Активен",
  pending_invitation: "Ждет приглашение",
  disqualified: "Дисквалифицирован",
};

export const getTeamCaptain = (team: Pick<Team, "members">): TeamMember | null =>
  team.members.find((member) => member.captain) ?? null;

export const formatTeamDate = (value: string | null): string => {
  if (!value) return "Не подана";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const normalizeModerationReason = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
