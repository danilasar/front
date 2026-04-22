import { createAsyncThunk } from "@reduxjs/toolkit";
import { hackathonApi } from "../../api/hackathonApi";
import type { CreateHackathonRequest, FormField, FormFieldScope } from "../../domain/types";
import { getErrorMessage } from "../../utils/errorTemplateMessage";
import { setError, startLoading, stopLoading } from "../settings";
import {
  setActiveHackathon,
  setCurrentHackathon,
  setFormFields,
  setHackathons,
  upsertHackathon,
  upsertFormField,
  removeFormField,
} from "./slice";

export const fetchHackathons = createAsyncThunk("hackathons/list", async (_, { dispatch }) => {
  try {
    dispatch(startLoading());
    const response = await hackathonApi.list();
    dispatch(setHackathons(response.items));
    return response.items;
  } catch (e: unknown) {
    dispatch(setError(getErrorMessage(e)));
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
    dispatch(setError(getErrorMessage(e)));
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
      dispatch(setError(getErrorMessage(e)));
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
      dispatch(setError(getErrorMessage(e)));
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
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const fetchFormFields = createAsyncThunk(
  "hackathons/fields",
  async (data: { hackathonId: string; scope?: FormFieldScope }, { dispatch }) => {
    try {
      const response = await hackathonApi.fields(data.hackathonId, data.scope);
      dispatch(setFormFields(response));
      return response;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return [];
    }
  },
);

export const createFormField = createAsyncThunk(
  "hackathons/createField",
  async (data: { hackathonId: string; field: Omit<FormField, "id" | "hackathonId"> }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await hackathonApi.createField(data.hackathonId, data.field);
      dispatch(upsertFormField(response));
      return response;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const updateFormField = createAsyncThunk(
  "hackathons/updateField",
  async (data: { hackathonId: string; fieldId: string; patch: Partial<Omit<FormField, "id" | "hackathonId">> }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await hackathonApi.updateField(data.hackathonId, data.fieldId, data.patch);
      dispatch(upsertFormField(response));
      return response;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const deleteFormField = createAsyncThunk(
  "hackathons/deleteField",
  async (data: { hackathonId: string; fieldId: string }, { dispatch }) => {
    try {
      dispatch(startLoading());
      await hackathonApi.deleteField(data.hackathonId, data.fieldId);
      dispatch(removeFormField(data.fieldId));
      return data.fieldId;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);
