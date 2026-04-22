import { createAsyncThunk } from "@reduxjs/toolkit";
import { teamApi } from "../../api/hackathonApi";
import type { CreateTeamApplicationRequest, ExportFormat, TeamStatus } from "../../domain/types";
import { getErrorMessage } from "../../utils/errorTemplateMessage";
import { setError, startLoading, stopLoading } from "../settings";
import { setInvitationLinks, setTeams, upsertTeam } from "./slice";

export const fetchTeams = createAsyncThunk(
  "teams/list",
  async (data: { hackathonId: string; status?: TeamStatus }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await teamApi.list(data.hackathonId, data.status);
      dispatch(setTeams(response.items));
      return response.items;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return [];
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const createTeamApplication = createAsyncThunk(
  "teams/createApplication",
  async (data: { hackathonId: string; application: CreateTeamApplicationRequest }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await teamApi.createApplication(data.hackathonId, data.application);
      dispatch(upsertTeam(response.team));
      dispatch(setInvitationLinks(response.invitationLinks));
      return response;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const updateTeamStatus = createAsyncThunk(
  "teams/status",
  async (data: { hackathonId: string; teamId: string; status: TeamStatus; reason?: string }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await teamApi.setStatus(data.hackathonId, data.teamId, data.status, data.reason);
      dispatch(upsertTeam(response));
      return response;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const disqualifyTeamMember = createAsyncThunk(
  "teams/disqualifyMember",
  async (data: { hackathonId: string; teamId: string; memberId: string }, { dispatch }) => {
    try {
      dispatch(startLoading());
      const response = await teamApi.disqualifyMember(data.hackathonId, data.teamId, data.memberId);
      dispatch(upsertTeam(response));
      return response;
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);

export const exportTeamsFile = createAsyncThunk(
  "teams/export",
  async (data: { hackathonId: string; format: ExportFormat }, { dispatch }) => {
    try {
      dispatch(startLoading());
      return await teamApi.exportTeams(data.hackathonId, data.format);
    } catch (e: unknown) {
      dispatch(setError(getErrorMessage(e)));
      return null;
    } finally {
      dispatch(stopLoading());
    }
  },
);
