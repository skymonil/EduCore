import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../authSlice";

const COURSE_PURCHASE_API = import.meta.env.MODE === "development" ? "http://localhost:8080/api/v1/purchase" : "/api/v1/purchase";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: COURSE_PURCHASE_API,
  credentials: "include",
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Attempt refresh
    const refreshResult = await rawBaseQuery("http://localhost:8080/api/v1/user/refresh", api, extraOptions);


    if (refreshResult?.error) {
      api.dispatch(userLoggedOut()); // logout if refresh fails
      return refreshResult;
    }

    // Retry original request
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};
export const purchaseApi = createApi({
  reducerPath: "purchaseApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    createCheckoutSession: builder.mutation({
      query: (courseId) => ({
        url: "/checkout/create-checkout-session",
        method: "POST",
        body: { courseId },
      }),
    }),
    getCourseDetailWithStatus: builder.query({
      query: (courseId) => ({
        url: `/course/${courseId}/detail-with-status`,
        method: "GET",
      }),
    }),
    getPurchasedCourses: builder.query({
      query: () => ({
        url: `/`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useCreateCheckoutSessionMutation,
  useGetCourseDetailWithStatusQuery,
  useGetPurchasedCoursesQuery,
} = purchaseApi;
