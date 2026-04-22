export type RulesValidationResult = {
  valid: boolean;
  error: string | null;
};

const maxPdfSizeBytes = 10 * 1024 * 1024;

export const validateRulesPdf = (file: File | null): RulesValidationResult => {
  if (!file) {
    return { valid: false, error: "Выберите PDF-регламент" };
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return { valid: false, error: "Регламент должен быть PDF-файлом" };
  }

  if (file.size > maxPdfSizeBytes) {
    return { valid: false, error: "PDF-регламент должен быть меньше 10 МБ" };
  }

  return { valid: true, error: null };
};
