import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AxiosError } from "axios";
import { hackathonApi } from "../../api/hackathonApi";
import type { ApiError } from "../../api/type";
import type { CreateHackathonRequest } from "../../domain/types";
import { getErrorMessage } from "../../utils/errorTemplateMessage";
import { setError, startLoading, stopLoading } from "../settings";
import {
  setActiveHackathon,
  setCurrentHackathon,
  setFormFields,
  setHackathons,
  upsertHackathon,
} from "./slice";

export const fetchHackathons = createAsyncThunk("hackathons/list", async (_, { dispatch }) => {
  try {
    dispatch(startLoading());
    const response = await hackathonApi.list();
    dispatch(setHackathons(response.items));
    return response.items;
  } catch (e: unknown) {
    const error = e as AxiosError<ApiError>;
    dispatch(setError(getErrorMessage(error)));
    return [];
  } finally {
    dispatch(stopLoading());
  }
});

export const fetchActiveHackathon = createAsyncThunk("hackathons/active", async (_, { dispatch }) => {
  try {
    dispatch(startLoading());
    const response = await hackathonApi.active();
    dispatch(setActiveHackathon(response));
    return response;
  } catch {
    dispatch(setActiveHackathon(null));
    return null;
  } finally {
    dispatch(stopLoading());
  }
});

export const fetchHackathon = createAsyncThunk("hackathons/get", async (id: string, { dispatch }) => {
  try {
    dispatch(startLoading());
    const response = await hackathonApi.get(id);
    dispatch(setCurrentHackathon(response));
    return response;
  } catch (e: unknown) {
    const error = e as AxiosError<ApiError>;
    dispatch(setError(getErrorMessage(error)));
    return null;
  } finally {
    dispatch(stopLoading());
  }
});

export const createHackathon = createAsyncThunk(
  "hackathons/create",
  async (data: CreateHackathonRequest, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await hackathonApi.create(data);
      dispatch(upsertHackathon(response));
      return response;
    } catch (e: unknown) {
      const error = e as AxiosError<ApiError>;
      dispatch(setError(getErrorMessage(error)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const activateHackathon = createAsyncThunk(
  "hackathons/activate",
  async (id: string, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await hackathonApi.activate(id);
      dispatch(upsertHackathon(response));
      dispatch(setActiveHackathon(response));
      return response;
    } catch (e: unknown) {
      const error = e as AxiosError<ApiError>;
      dispatch(setError(getErrorMessage(error)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const uploadHackathonRules = createAsyncThunk(
  "hackathons/rules",
  async (data: { hackathonId: string; file: File }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await hackathonApi.uploadRules(data.hackathonId, data.file);
      dispatch(upsertHackathon(response));
      return response;
    } catch (e: unknown) {
      const error = e as AxiosError<ApiError>;
      dispatch(setError(getErrorMessage(error)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const fetchFormFields = createAsyncThunk(
  "hackathons/fields",
  async (data: { hackathonId: string; scope?: string }, { dispatch }) => {
    try {
      const response = await hackathonApi.fields(data.hackathonId, data.scope);
      dispatch(setFormFields(response));
      return response;
    } catch (e: unknown) {
      const error = e as AxiosError<ApiError>;
      dispatch(setError(getErrorMessage(error)));
      return [];
    }
  },
);
