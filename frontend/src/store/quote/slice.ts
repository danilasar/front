import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { QuoteState } from "./types";
import type { Quote } from "../../entities/quote/type";

const initialState: QuoteState = {
  quotes: [],
  randomQuote: null,
  offset: 0,
  limit: 10,
  total: 0,
}

const quoteSlice = createSlice({
  name: "quote",
  initialState,
  reducers: {
    setQuotes: (
      state,
      action: PayloadAction<{
        quotes: Quote[];
        offset: number;
      }>
    ) => {
      state.quotes = action.payload.quotes;
      state.offset = action.payload.offset;
    },

    setTotal: (state, action: PayloadAction<number>) => {
      state.total = action.payload;
    },

    setRandomQuote: (state, action: PayloadAction<Quote>) => {
      state.randomQuote = action.payload;
    },
  },
});

export const {
  setQuotes,
  setRandomQuote,
  setTotal,
} = quoteSlice.actions;

export default quoteSlice.reducer;
