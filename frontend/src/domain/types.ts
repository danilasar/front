export type ID = string;

export type Role = "participant" | "organizer" | "admin";

export type HackathonStatus = "draft" | "active" | "archived";

export type TeamStatus =
  | "draft"
  | "submitted"
  | "admitted"
  | "rejected"
  | "disqualified"
  | "withdrawn";

export type FormFieldScope = "profile" | "team" | "feedback";

export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "url"
  | "date"
  | "datetime"
  | "time"
  | "checkbox"
  | "radio"
  | "select"
  | "file";

export type DynamicFieldValue = string | number | boolean | string[];

export type DynamicFieldValues = Record<string, DynamicFieldValue>;

export type FileAsset = {
  id: ID;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type UserPublic = {
  id: ID;
  login?: string;
  fullName: string;
  role: Role;
  avatar: FileAsset | null;
};

export type UserProfile = UserPublic & {
  email: string;
  education: string | null;
  course: string | null;
  phone: string | null;
  telegram: string | null;
  vk: string | null;
  foodAllergies: string | null;
  tshirtSize: "XS" | "S" | "M" | "L" | "XL" | "XXL" | null;
  profileFields: DynamicFieldValues;
  blocked?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: UserProfile;
  tokens: TokenPair;
};

export type Page<T> = {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
};

export type HackathonLanding = {
  heroTitle?: string;
  heroSubtitle?: string;
  coverFileId?: ID | null;
  content?: string;
};

export type Hackathon = {
  id: ID;
  title: string;
  description: string | null;
  status: HackathonStatus;
  startsAt: string;
  endsAt: string;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  minTeamSize: number;
  maxTeamSize: number;
  rulesFile: FileAsset | null;
  organizerIds: ID[];
  landing: HackathonLanding;
  createdAt: string;
  updatedAt: string;
};

export type CreateHackathonRequest = {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  minTeamSize: number;
  maxTeamSize: number;
  landing?: HackathonLanding;
};

export type FormFieldOption = {
  value: string;
  label: string;
};

export type FormField = {
  id: ID;
  hackathonId: ID;
  scope: FormFieldScope;
  key: string;
  label: string;
  description: string | null;
  type: FormFieldType;
  required: boolean;
  visible: boolean;
  order: number;
  options: FormFieldOption[];
  validation: Record<string, unknown>;
};

export type TeamMember = {
  id: ID;
  user: UserPublic | null;
  source: "existing_user" | "invited_new_user";
  login: string | null;
  fullName: string;
  email: string | null;
  captain: boolean;
  status: "active" | "pending_invitation" | "disqualified";
  profileFields: DynamicFieldValues;
};

export type Team = {
  id: ID;
  hackathonId: ID;
  name: string;
  status: TeamStatus;
  members: TeamMember[];
  fields: DynamicFieldValues;
  submittedAt: string | null;
  moderationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeamMemberInput =
  | {
    kind: "existing_user";
    login: string;
    captain?: boolean;
  }
  | {
    kind: "new_user";
    fullName: string;
    email?: string | null;
    captain?: boolean;
    profileFields?: DynamicFieldValues;
  };

export type CreateTeamApplicationRequest = {
  name: string;
  fields?: DynamicFieldValues;
  members: TeamMemberInput[];
};

export type TeamApplicationResponse = {
  team: Team;
  invitationLinks: Array<{
    memberId: ID;
    url: string;
  }>;
};

export type InvitationStatus = "pending" | "accepted" | "expired";

export type Invitation = {
  token: string;
  hackathonId: ID;
  teamId: ID;
  memberId: ID;
  fullName: string;
  email: string | null;
  status: InvitationStatus;
  prefilledProfileFields: DynamicFieldValues;
  expiresAt: string;
};

export type CompleteInvitationRegistrationRequest = {
  email: string;
  password: string;
  fullName: string;
  profileFields?: DynamicFieldValues;
};

export type CreateOrganizerRequest = {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
};

export type ErrorResponse = {
  code: string;
  message: string;
};
