import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { setError, startLoading, stopLoading } from "../settings/slice";
import type { AxiosError } from "axios";
import type { ApiError } from "../../api/type";
import { getErrorMessage } from "../../utils/errorTemplateMessage";
import { authFailed, authSuccess, clearUser, setUser } from "./slice";

export const logout = createAsyncThunk(
  "user/logout",
  async (_, { dispatch }) => {
    sessionStorage.setItem("refreshToken", "");
    sessionStorage.setItem("accessToken", "");
    dispatch(clearUser())
  });

export const login = createAsyncThunk(
  "user/login",
  async (data: { email: string; password: string }, { dispatch }) => {
    try {
      dispatch(startLoading())
      const tokens = await api.post<{ accessToken: string, refreshToken: string }>(
        "Auth/Login", data
      );

      sessionStorage.setItem("refreshToken", tokens.data.refreshToken);
      sessionStorage.setItem("accessToken", tokens.data.accessToken);

      dispatch(authSuccess());
      await dispatch(getMe()).unwrap();
    } catch (e: unknown) {
      const error = e as AxiosError<ApiError>;
      dispatch(authFailed());
      dispatch(setError(getErrorMessage(error)));
    }
    finally {
      dispatch(stopLoading())
    }
  }
)

export const register = createAsyncThunk(
  "user/register",
  async (data: {
    firstName: string;
    secondName: string;
    email: string;
    password: string
  }, { dispatch }) => {
    try {
      dispatch(startLoading())
      const tokens = await api.post<{ accessToken: string, refreshToken: string }>(
        "Auth/Registration", data
      );

      sessionStorage.setItem("refreshToken", tokens.data.refreshToken);
      sessionStorage.setItem("accessToken", tokens.data.accessToken);

      dispatch(authSuccess());
      await dispatch(getMe()).unwrap();
    } catch (e: unknown) {
      const error = e as AxiosError<ApiError>;
      dispatch(authFailed());
      dispatch(setError(getErrorMessage(error)));
    }
    finally {
      dispatch(stopLoading())
    }
  }
)

export const getMe = createAsyncThunk(
  "user/getMe",
  async (_, { dispatch }) => {
    try {
      dispatch(startLoading())
      const user = await api.get("User/myprofile");

      dispatch(setUser(user.data));
    } catch {
      dispatch(clearUser());
      dispatch(setError("Сессия истекла. Зайдите заново"));
    }
    finally {
      dispatch(stopLoading())
    }
  }
)

export const refresh = createAsyncThunk(
  "user/refresh",
  async (_, { dispatch }) => {
    dispatch(startLoading())
    const oldRefreshToken = sessionStorage.getItem("refreshToken");

    try {
      const res = await api.post<{ accessToken: string, refreshToken: string }>(
        "Auth/RefreshAllTokens",
        null,
        { params: { oldRefreshToken } }
      );

      sessionStorage.setItem("accessToken", res.data.accessToken);
      sessionStorage.setItem("refreshToken", res.data.refreshToken);

      return true;
    } catch {
      dispatch(logout());
      return false;
    }
    finally {
      dispatch(stopLoading())
    }
  }
);

export const refreshAuth = createAsyncThunk(
  "user/refreshAuth",
  async (_, { dispatch }) => {
    dispatch(startLoading())
    try {
      const isRefresed = await dispatch(refresh());
      if (isRefresed) {
        await dispatch(getMe());
      }
      else {
        dispatch(authFailed());
      }
    } catch {
      dispatch(logout());
      dispatch(authFailed());
    }
    finally {
      dispatch(stopLoading())
    }
  }
);
