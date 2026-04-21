import type { CreateTeamApplicationRequest, TeamApplicationResponse, TeamMemberInput } from "./types";

export type TeamMemberFormValues = {
  id: string;
  kind: "existing_user" | "new_user";
  login: string;
  fullName: string;
  email: string;
  captain: boolean;
  education: string;
  course: string;
};

export type TeamApplicationFormValues = {
  name: string;
  members: TeamMemberFormValues[];
};

export type TeamFormValidationResult = {
  valid: boolean;
  errors: string[];
};

export type InvitationLinkView = {
  memberId: string;
  label: string;
  url: string;
};

export const createEmptyExistingMember = (id: string): TeamMemberFormValues => ({
  id,
  kind: "existing_user",
  login: "",
  fullName: "",
  email: "",
  captain: false,
  education: "",
  course: "",
});

export const createEmptyNewMember = (id: string): TeamMemberFormValues => ({
  id,
  kind: "new_user",
  login: "",
  fullName: "",
  email: "",
  captain: false,
  education: "",
  course: "",
});

export const normalizeCaptain = (members: TeamMemberFormValues[], captainId: string): TeamMemberFormValues[] =>
  members.map((member) => ({
    ...member,
    captain: member.id === captainId,
  }));

export const changeMemberKind = (
  member: TeamMemberFormValues,
  kind: TeamMemberFormValues["kind"],
): TeamMemberFormValues => ({
  ...(kind === "existing_user" ? createEmptyExistingMember(member.id) : createEmptyNewMember(member.id)),
  captain: member.captain,
});

export const validateTeamApplicationForm = (
  values: TeamApplicationFormValues,
  minTeamSize: number,
  maxTeamSize: number,
): TeamFormValidationResult => {
  const errors: string[] = [];
  const activeMembers = values.members;

  if (values.name.trim().length < 2) errors.push("Укажите название команды");
  if (activeMembers.length < minTeamSize) errors.push(`Минимум участников: ${minTeamSize}`);
  if (activeMembers.length > maxTeamSize) errors.push(`Максимум участников: ${maxTeamSize}`);
  if (activeMembers.filter((member) => member.captain).length !== 1) errors.push("В команде должен быть ровно один капитан");

  activeMembers.forEach((member, index) => {
    const label = `Участник ${index + 1}`;
    if (member.kind === "existing_user" && member.login.trim().length === 0) {
      errors.push(`${label}: укажите логин`);
    }
    if (member.kind === "new_user" && member.fullName.trim().length < 2) {
      errors.push(`${label}: укажите ФИО`);
    }
    if (member.kind === "new_user" && member.education.trim().length < 2) {
      errors.push(`${label}: укажите учебное заведение`);
    }
    if (member.kind === "new_user" && member.course.trim().length === 0) {
      errors.push(`${label}: укажите курс`);
    }
    if (member.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
      errors.push(`${label}: укажите корректную почту`);
    }
  });

  return { valid: errors.length === 0, errors };
};

export const toTeamApplicationRequest = (values: TeamApplicationFormValues): CreateTeamApplicationRequest => ({
  name: values.name.trim(),
  members: values.members.map<TeamMemberInput>((member) => {
    if (member.kind === "existing_user") {
      return {
        kind: "existing_user",
        login: member.login.trim(),
        captain: member.captain,
      };
    }

    return {
      kind: "new_user",
      fullName: member.fullName.trim(),
      email: member.email.trim() || null,
      captain: member.captain,
      profileFields: {
        ...(member.education.trim() ? { education: member.education.trim() } : {}),
        ...(member.course.trim() ? { course: member.course.trim() } : {}),
      },
    };
  }),
});

export const buildInvitationLinkViews = (response: TeamApplicationResponse): InvitationLinkView[] =>
  response.invitationLinks.map((link) => {
    const member = response.team.members.find((item) => item.id === link.memberId);
    return {
      memberId: link.memberId,
      label: member?.fullName.trim() || member?.email?.trim() || "Новый участник",
      url: link.url,
    };
  });
