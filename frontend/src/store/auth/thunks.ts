import { createAsyncThunk } from "@reduxjs/toolkit";
import { authApi, invitationApi } from "../../api/hackathonApi";
import type { CompleteInvitationRegistrationRequest } from "../../domain/types";
import { getErrorMessage } from "../../utils/errorTemplateMessage";
import { setError, startLoading, stopLoading } from "../settings";
import { authFailed, authSuccess, clearAuth } from "./slice";

const persistTokens = (tokens: { accessToken: string; refreshToken: string }) => {
  sessionStorage.setItem("accessToken", tokens.accessToken);
  sessionStorage.setItem("refreshToken", tokens.refreshToken);
};

const clearTokens = () => {
  sessionStorage.setItem("accessToken", "");
  sessionStorage.setItem("refreshToken", "");
};

export const login = createAsyncThunk(
  "auth/login",
  async (data: { email: string; password: string }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await authApi.login(data);
      persistTokens(response.tokens);
      dispatch(authSuccess(response.user));
      return response.user;
    } catch (e: unknown) {
      dispatch(authFailed());
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (data: { email: string; password: string; fullName: string }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await authApi.register(data);
      persistTokens(response.tokens);
      dispatch(authSuccess(response.user));
      return response.user;
    } catch (e: unknown) {
      dispatch(authFailed());
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const completeInviteRegistration = createAsyncThunk(
  "auth/completeInviteRegistration",
  async (data: { token: string; form: CompleteInvitationRegistrationRequest }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await invitationApi.completeRegistration(data.token, data.form);
      persistTokens(response.tokens);
      dispatch(authSuccess(response.user));
      return response.user;
    } catch (e: unknown) {
      dispatch(authFailed());
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const restoreAuth = createAsyncThunk("auth/restore", async (_, { dispatch }) => {
  const refreshToken = sessionStorage.getItem("refreshToken");
  if (!refreshToken) {
    dispatch(authFailed());
    return null;
  }

  try {
    dispatch(startLoading());
    const tokens = await authApi.refresh(refreshToken);
    persistTokens(tokens);
    const user = await authApi.me();
    dispatch(authSuccess(user));
    return user;
  } catch {
    clearTokens();
    dispatch(authFailed());
    return null;
  } finally {
    dispatch(stopLoading());
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  clearTokens();
  dispatch(clearAuth());
});
