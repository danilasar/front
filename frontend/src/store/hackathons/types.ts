import type { FormField, Hackathon } from "../../domain/types";

export type HackathonsState = {
  items: Hackathon[];
  active: Hackathon | null;
  current: Hackathon | null;
  fields: FormField[];
};
