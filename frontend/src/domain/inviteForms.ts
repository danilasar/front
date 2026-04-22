import type { CompleteInvitationRegistrationRequest, DynamicFieldValues, Invitation } from "./types";

export type InviteRegistrationFormValues = {
  fullName: string;
  email: string;
  password: string;
  education: string;
  course: string;
};

export type InviteValidationResult = {
  valid: boolean;
  errors: string[];
};

export const toInviteRegistrationInitialValues = (invitation: Invitation | null): InviteRegistrationFormValues => ({
  fullName: invitation?.fullName ?? "",
  email: invitation?.email ?? "",
  password: "password",
  education: typeof invitation?.prefilledProfileFields.education === "string" ? invitation.prefilledProfileFields.education : "",
  course: typeof invitation?.prefilledProfileFields.course === "string" ? invitation.prefilledProfileFields.course : "",
});

export const validateInviteRegistrationForm = (values: InviteRegistrationFormValues): InviteValidationResult => {
  const errors: string[] = [];
  if (values.fullName.trim().length < 2) errors.push("Укажите ФИО");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.push("Укажите корректную почту");
  if (values.password.length < 6) errors.push("Пароль должен быть не короче 6 символов");
  if (values.education.trim().length < 2) errors.push("Укажите учебное заведение");
  if (values.course.trim().length === 0) errors.push("Укажите курс");
  return { valid: errors.length === 0, errors };
};

export const toInviteRegistrationRequest = (
  values: InviteRegistrationFormValues,
): CompleteInvitationRegistrationRequest => {
  const profileFields: DynamicFieldValues = {
    education: values.education.trim(),
    course: values.course.trim(),
  };

  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    password: values.password,
    profileFields,
  };
};
