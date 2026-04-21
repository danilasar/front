import type { Quote } from "../../entities/quote/type"
import type { } from "../../entities/user/types"

export type QuoteState = {
  quotes: Quote[];
  randomQuote: Quote | null;
  offset: number;
  limit: number;
  total: number;
};
