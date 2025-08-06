import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedOut } from "../authSlice";

// Define API base
const COURSE_API =
  import.meta.env.MODE === "development"
    ? "http://localhost:8080/api/v1/course"
    : "/api/v1/course";

// 🔐 CSRF token management
let csrfToken = "";

// Helper to fetch latest CSRF token
const fetchCsrfToken = async () => {
  const res = await fetch(
    import.meta.env.MODE === "development"
      ? "http://localhost:8080/csrf-token"
      : "/csrf-token",
    { credentials: "include" }
  );
  const data = await res.json();
  csrfToken = data.csrfToken;
};

// ✅ Base fetch function
const rawBaseQuery = fetchBaseQuery({
  baseUrl: COURSE_API,
  credentials: "include",
  prepareHeaders: (headers) => {
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
    return headers;
  },
});

// ✅ Wrapper for handling CSRF and token refresh on 401
const baseQueryWithCsrfAndReauth = async (args, api, extraOptions) => {
  // If it's a mutation, refresh CSRF token
  const method = typeof args === "string" ? "GET" : args.method?.toUpperCase();
  const requiresCsrf = ["POST", "PUT", "DELETE", "PATCH"].includes(method);

  if (requiresCsrf) {
    await fetchCsrfToken();
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Attempt token refresh
    const refreshResult = await rawBaseQuery("/refresh", api, extraOptions);

    if (refreshResult?.error) {
      api.dispatch(userLoggedOut());
      return refreshResult;
    }

    // Retry original request
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

// ✅ Main API definition
export const courseApi = createApi({
  reducerPath: "courseApi",
  tagTypes: ["Refetch_Creator_Course", "Refetch_Lecture"],
  baseQuery: baseQueryWithCsrfAndReauth,
  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: ({ courseTitle, category }) => ({
        url: "",
        method: "POST",
        body: { courseTitle, category },
      }),
      invalidatesTags: ["Refetch_Creator_Course"],
    }),
    getSearchCourse: builder.query({
      query: ({ searchQuery, categories, sortByPrice }) => {
        let queryString = `/search?query=${encodeURIComponent(searchQuery)}`;
        if (categories?.length > 0) {
          queryString += `&categories=${categories.map(encodeURIComponent).join(",")}`;
        }
        if (sortByPrice) {
          queryString += `&sortByPrice=${encodeURIComponent(sortByPrice)}`;
        }
        return {
          url: queryString,
          method: "GET",
        };
      },
    }),
    getPublishedCourse: builder.query({
      query: () => ({
        url: "/published-courses",
        method: "GET",
      }),
    }),
    getCreatorCourse: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["Refetch_Creator_Course"],
    }),
    editCourse: builder.mutation({
      query: ({ formData, courseId }) => ({
        url: `/${courseId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Refetch_Creator_Course"],
    }),
    getCourseById: builder.query({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "GET",
      }),
    }),
    createLecture: builder.mutation({
      query: ({ lectureTitle, courseId }) => ({
        url: `/${courseId}/lecture`,
        method: "POST",
        body: { lectureTitle },
      }),
      invalidatesTags: ["Refetch_Lecture"],
    }),
    getCourseLecture: builder.query({
      query: (courseId) => ({
        url: `/${courseId}/lecture`,
        method: "GET",
      }),
      providesTags: ["Refetch_Lecture"],
    }),
    editLecture: builder.mutation({
      query: ({
        lectureTitle,
        videoInfo,
        isPreviewFree,
        courseId,
        lectureId,
      }) => ({
        url: `/${courseId}/lecture/${lectureId}`,
        method: "POST",
        body: { lectureTitle, videoInfo, isPreviewFree },
      }),
      invalidatesTags: ["Refetch_Lecture"],
    }),
    removeLecture: builder.mutation({
      query: (lectureId) => ({
        url: `/lecture/${lectureId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Refetch_Lecture"],
    }),
    getLectureById: builder.query({
      query: (lectureId) => ({
        url: `/lecture/${lectureId}`,
        method: "GET",
      }),
    }),
    publishCourse: builder.mutation({
      query: ({ courseId, query }) => ({
        url: `/${courseId}?publish=${query}`,
        method: "PATCH",
      }),
    }),
  }),
});

export const {
  useCreateCourseMutation,
  useGetSearchCourseQuery,
  useGetPublishedCourseQuery,
  useGetCreatorCourseQuery,
  useEditCourseMutation,
  useGetCourseByIdQuery,
  useCreateLectureMutation,
  useGetCourseLectureQuery,
  useEditLectureMutation,
  useRemoveLectureMutation,
  useGetLectureByIdQuery,
  usePublishCourseMutation,
} = courseApi;
