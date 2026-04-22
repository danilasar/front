import type { FormField, FormFieldOption, FormFieldType } from "./types";

export type TeamFieldFormValues = {
  key: string;
  label: string;
  description: string;
  type: FormFieldType;
  required: boolean;
  visible: boolean;
  optionsText: string;
};

export type TeamFieldValidationResult = {
  valid: boolean;
  errors: string[];
};

export const teamFieldTypeOptions: Array<{ value: FormFieldType; label: string }> = [
  { value: "text", label: "Текст" },
  { value: "textarea", label: "Длинный текст" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Телефон" },
  { value: "url", label: "Ссылка" },
  { value: "select", label: "Список" },
  { value: "radio", label: "Один вариант" },
  { value: "checkbox", label: "Чекбокс" },
  { value: "file", label: "Файл" },
];

export const initialTeamFieldForm: TeamFieldFormValues = {
  key: "",
  label: "",
  description: "",
  type: "text",
  required: false,
  visible: true,
  optionsText: "",
};

export const fieldTypeNeedsOptions = (type: FormFieldType): boolean =>
  type === "select" || type === "radio";

export const parseFieldOptions = (value: string): FormFieldOption[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValue, ...labelParts] = line.split(":");
      const optionValue = rawValue.trim();
      const label = labelParts.join(":").trim() || optionValue;
      return { value: optionValue, label };
    });

export const validateTeamFieldForm = (values: TeamFieldFormValues): TeamFieldValidationResult => {
  const errors: string[] = [];

  if (!/^[a-z][a-z0-9_]{1,31}$/.test(values.key.trim())) {
    errors.push("Ключ поля: латиница, цифры и _, от 2 до 32 символов, первый символ буква");
  }
  if (values.label.trim().length < 2) errors.push("Укажите подпись поля");
  if (fieldTypeNeedsOptions(values.type) && parseFieldOptions(values.optionsText).length === 0) {
    errors.push("Для выбранного типа нужны варианты");
  }

  return { valid: errors.length === 0, errors };
};

export const toTeamFieldRequest = (
  values: TeamFieldFormValues,
  order: number,
): Omit<FormField, "id" | "hackathonId"> => ({
  scope: "team",
  key: values.key.trim(),
  label: values.label.trim(),
  description: values.description.trim() || null,
  type: values.type,
  required: values.required,
  visible: values.visible,
  order,
  options: parseFieldOptions(values.optionsText),
  validation: {},
});
