import type { Store } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "../store";
import type { InternalAxiosRequestConfig } from "axios";

export interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export type AppStore = Store<RootState> & {
  dispatch: AppDispatch;
};

export type ApiError = {
  message?: string;
}
