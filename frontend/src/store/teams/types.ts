import type { Team, TeamApplicationResponse } from "../../domain/types";

export type TeamsState = {
  items: Team[];
  lastInvitationLinks: TeamApplicationResponse["invitationLinks"];
};
