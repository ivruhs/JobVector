import { apiSlice } from "./apiSlice";

export const completeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    completeAnalysis: builder.mutation({
      query: (data) => ({
        url: "/api/ai/complete",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useCompleteAnalysisMutation } = completeApiSlice;
