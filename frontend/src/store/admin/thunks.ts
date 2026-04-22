import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminApi } from "../../api/hackathonApi";
import type { CreateOrganizerRequest } from "../../domain/types";
import { getErrorMessage } from "../../utils/errorTemplateMessage";
import { setError, startLoading, stopLoading } from "../settings";
import { setOrganizers, upsertOrganizer } from "./slice";

export const fetchOrganizers = createAsyncThunk("admin/organizers", async (_, { dispatch }) => {
  try {
    dispatch(startLoading());
    const response = await adminApi.listOrganizers();
    dispatch(setOrganizers(response.items));
    return response.items;
  } catch (e: unknown) {
    dispatch(setError(getErrorMessage(e)));
    return [];
  } finally {
    dispatch(stopLoading());
  }
});

export const createOrganizer = createAsyncThunk(
  "admin/createOrganizer",
  async (data: CreateOrganizerRequest, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await adminApi.createOrganizer(data);
      dispatch(upsertOrganizer(response));
      return response;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const assignOrganizer = createAsyncThunk(
  "admin/assignOrganizer",
  async (data: { hackathonId: string; organizerId: string }, { dispatch }) => {
    try {
      dispatch(startLoading());
      await adminApi.assignOrganizer(data.hackathonId, data.organizerId);
      return data;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);
