import { isAxiosError } from "axios";
import type { ApiError } from "../api/type";

const fallbackMessages: Record<number, string> = {
  400: "Неверный запрос",
  401: "Не авторизован",
  403: "Недостаточно прав",
  404: "Данные не найдены. Повторите запрос позже",
  409: "Конфликт данных",
  415: "Неподдерживаемый тип файла",
  422: "Проверьте данные формы",
  500: "Техническая ошибка на сервере",
};

export const isApiError = (value: unknown): value is ApiError => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ApiError>;
  return typeof candidate.code === "string" && typeof candidate.message === "string";
};

export const getApiError = (error: unknown): ApiError | null => {
  if (!isAxiosError<ApiError>(error)) return null;
  const data = error.response?.data;
  return isApiError(data) ? data : null;
};

export const getApiValidationMessages = (error: unknown): string[] => {
  const apiError = getApiError(error);
  return apiError?.fields?.map((field) => `${field.field}: ${field.message}`) ?? [];
};

export function getErrorMessage(error: unknown) {
  const apiError = getApiError(error);
  if (apiError) {
    const fieldMessages = getApiValidationMessages(error);
    return fieldMessages.length > 0 ? `${apiError.message}: ${fieldMessages.join("; ")}` : apiError.message;
  }

  if (isAxiosError(error)) {
    const status = error.response?.status ?? -1;
    return fallbackMessages[status] ?? "Неизвестная ошибка";
  }

  return "Неизвестная ошибка";
}
