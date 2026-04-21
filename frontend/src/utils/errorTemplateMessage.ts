import type { AxiosError } from "axios";
import type { ApiError } from "../api/type";

export function getErrorMessage(error: AxiosError<ApiError, unknown>) {
  let message = "";

  const status = error.response?.status ?? -1;
  switch (status) {
    case 400: message = "Неверный запрос"; break;
    case 404: message = "Данные не найденны, увы. Повторите запрос позже"; break;
    case 409: message = "Почта уже занята"; break;
    case 422: message = "Неправильные данные"; break;
    case 500: message = "Технические шоколадки на сервере"; break;
    default: message = "Неизвестаная ошибка"
  }

  return error.response?.data.message ?? message
}
