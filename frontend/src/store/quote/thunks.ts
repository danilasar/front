import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { setError, startLoading, stopLoading } from "../settings";
import type { AxiosError } from "axios";
import type { ApiError } from "../../api/type";
import { setQuotes, setRandomQuote, setTotal } from "./slice";
import type { Quote } from "../../entities/quote/type";
import { getErrorMessage } from "../../utils/errorTemplateMessage";

export const createQuote = createAsyncThunk(
  "quotes/create",
  async (quoteText: string, { rejectWithValue, dispatch }) => {
    try {
      dispatch(startLoading())
      await api.post<Quote>("/Quote", null, { params: { quoteText } });
    }
    catch (e: unknown) {
      const error = e as AxiosError<ApiError>;
      dispatch(setError(getErrorMessage(error)));
      return rejectWithValue(error.response?.data.message)
    }
    finally {
      dispatch(stopLoading())
    }
  }
);

export const fetchQuotes = createAsyncThunk(
  "quotes/fetch",
  async ({ offset, limit }: { offset: number; limit: number }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(startLoading())
      const res = await api.get<Quote[]>(`/Quote/${offset}/${limit}`);

      dispatch(setQuotes({ quotes: res.data, offset }));

      await dispatch(fetchQuotesCount());
      return res.data;
    }
    catch (e: unknown) {
      const error = e as AxiosError<ApiError>;
      dispatch(setError(getErrorMessage(error)));
      return rejectWithValue(error.response?.data.message)
    }
    finally {
      dispatch(stopLoading())
    }
  }
);

export const fetchQuotesCount = createAsyncThunk<number>(
  "quotes/count",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      dispatch(startLoading())
      const res = await api.get<number>("/Quote/TotalQuotes");
      dispatch(setTotal(res.data));
      return res.data;
    } catch {
      return rejectWithValue(0);
    }
    finally {
      dispatch(stopLoading())
    }
  }
);

export const fetchRandomQuote = createAsyncThunk(
  "quotes/random",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      dispatch(startLoading())

      const data = await api.get<Quote>("/Quote/GetRand");

      dispatch(setRandomQuote(data.data));
    }
    catch (e: unknown) {
      const error = e as AxiosError<ApiError>;
      dispatch(setError(getErrorMessage(error)));
      return rejectWithValue(error.response?.data.message)
    }
    finally {
      dispatch(stopLoading())
    }
  }
);
