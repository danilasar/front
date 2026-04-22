import type { Store } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "../store";
import type { InternalAxiosRequestConfig } from "axios";

export interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export type AppStore = Store<RootState> & {
  dispatch: AppDispatch;
};

export type ApiErrorField = {
  field: string;
  message: string;
};

export type ApiError = {
  code: string;
  message: string;
  fields?: ApiErrorField[];
};
