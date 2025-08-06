import { createApi,fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../authSlice";

const COURSE_PROGRESS_API = import.meta.env.MODE === "development" ? "http://localhost:8080/api/v1/progress" : "/api/v1/progress";
const rawBaseQuery = fetchBaseQuery({
  baseUrl: COURSE_PROGRESS_API,
  credentials: "include",
});

// ✅ Wrapper for handling token refresh on 401
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Attempt refresh
    const refreshResult = await rawBaseQuery("/refresh", api, extraOptions);

    if (refreshResult?.error) {
      api.dispatch(userLoggedOut()); // logout if refresh fails
      return refreshResult;
    }

    // Retry original request
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

export const courseProgressApi = createApi({
  reducerPath: "courseProgressApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getCourseProgress: builder.query({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "GET",
      }),
    }),
    updateLectureProgress: builder.mutation({
      query: ({ courseId, lectureId }) => ({
        url: `/${courseId}/lecture/${lectureId}/view`,
        method: "POST",
      }),
    }),
    completeCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}/complete`,
        method: "POST",
      }),
    }),
    inCompleteCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}/incomplete`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetCourseProgressQuery,
  useUpdateLectureProgressMutation,
  useCompleteCourseMutation,
  useInCompleteCourseMutation,
} = courseProgressApi;
