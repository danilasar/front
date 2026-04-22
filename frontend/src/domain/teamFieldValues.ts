import type { DynamicFieldValue, DynamicFieldValues, FormField } from "./types";

export const emptyFieldValue = (field: FormField): DynamicFieldValue => {
  if (field.type === "checkbox") return false;
  return "";
};

export const prepareTeamFieldValues = (
  fields: FormField[],
  values: DynamicFieldValues,
): DynamicFieldValues => fields
  .filter((field) => field.visible)
  .reduce<DynamicFieldValues>((acc, field) => {
    const value = values[field.key] ?? emptyFieldValue(field);
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) acc[field.key] = trimmed;
      return acc;
    }
    acc[field.key] = value;
    return acc;
  }, {});

export const validateRequiredTeamFields = (
  fields: FormField[],
  values: DynamicFieldValues,
): string[] => fields
  .filter((field) => field.visible && field.required)
  .flatMap((field) => {
    const value = values[field.key];
    if (typeof value === "boolean") return value ? [] : [`Заполните поле команды: ${field.label}`];
    if (Array.isArray(value)) return value.length > 0 ? [] : [`Заполните поле команды: ${field.label}`];
    if (typeof value === "number") return [];
    if (typeof value === "string") return value.trim().length > 0 ? [] : [`Заполните поле команды: ${field.label}`];
    return [`Заполните поле команды: ${field.label}`];
  });
