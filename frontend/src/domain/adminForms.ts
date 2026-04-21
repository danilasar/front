import type { CreateHackathonRequest, CreateOrganizerRequest, ID } from "./types";

export type OrganizerFormValues = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
};

export type HackathonFormValues = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  minTeamSize: number;
  maxTeamSize: number;
  organizerId: ID;
};

export type FormValidationResult = {
  valid: boolean;
  errors: string[];
};

export const validateOrganizerForm = (values: OrganizerFormValues): FormValidationResult => {
  const errors: string[] = [];

  if (values.fullName.trim().length < 2) errors.push("Укажите ФИО организатора");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.push("Укажите корректную почту");
  if (values.password.length < 8) errors.push("Пароль должен быть не короче 8 символов");

  return { valid: errors.length === 0, errors };
};

export const validateHackathonForm = (values: HackathonFormValues): FormValidationResult => {
  const errors: string[] = [];

  if (values.title.trim().length < 2) errors.push("Укажите название хакатона");
  if (!values.startsAt) errors.push("Укажите дату начала");
  if (!values.endsAt) errors.push("Укажите дату окончания");
  if (values.startsAt && values.endsAt && values.startsAt > values.endsAt) {
    errors.push("Дата окончания не может быть раньше даты начала");
  }
  if (values.minTeamSize < 1) errors.push("Минимальный размер команды должен быть не меньше 1");
  if (values.maxTeamSize < values.minTeamSize) {
    errors.push("Максимальный размер команды должен быть не меньше минимального");
  }

  return { valid: errors.length === 0, errors };
};

export const toOrganizerRequest = (values: OrganizerFormValues): CreateOrganizerRequest => ({
  fullName: values.fullName.trim(),
  email: values.email.trim(),
  password: values.password,
  phone: values.phone.trim() || null,
});

export const toHackathonRequest = (values: HackathonFormValues): CreateHackathonRequest => ({
  title: values.title.trim(),
  description: values.description.trim() || undefined,
  startsAt: new Date(`${values.startsAt}T09:00:00`).toISOString(),
  endsAt: new Date(`${values.endsAt}T18:00:00`).toISOString(),
  minTeamSize: Number(values.minTeamSize),
  maxTeamSize: Number(values.maxTeamSize),
  landing: {
    heroTitle: values.title.trim(),
    heroSubtitle: values.description.trim() || "Описание будет добавлено организатором",
  },
});
