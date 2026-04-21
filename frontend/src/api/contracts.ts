export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type ApiRequestOptions = {
  params?: QueryParams;
};
