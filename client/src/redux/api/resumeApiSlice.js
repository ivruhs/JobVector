import { apiSlice } from "./apiSlice";

export const resumeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadResume: builder.mutation({
      query: (formData) => ({
        url: "/api/resume/upload",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const { useUploadResumeMutation } = resumeApiSlice;
