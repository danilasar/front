import type { Hackathon, HackathonStatus } from "./types";

export type HackathonStatusFilter = HackathonStatus | "all";

export const hackathonStatusOptions: Array<{ value: HackathonStatusFilter; label: string }> = [
  { value: "all", label: "Все хакатоны" },
  { value: "active", label: "Активные" },
  { value: "draft", label: "Черновики" },
  { value: "archived", label: "Архив" },
];

export const hackathonStatusLabels: Record<HackathonStatus, string> = {
  draft: "Черновик",
  active: "Активный",
  archived: "Архив",
};

export const filterHackathons = (
  hackathons: Hackathon[],
  status: HackathonStatusFilter,
): Hackathon[] => status === "all"
  ? hackathons
  : hackathons.filter((hackathon) => hackathon.status === status);

export const formatHackathonPeriod = (hackathon: Pick<Hackathon, "startsAt" | "endsAt">): string => {
  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${formatter.format(new Date(hackathon.startsAt))} - ${formatter.format(new Date(hackathon.endsAt))}`;
};
