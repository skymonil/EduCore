import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../authSlice";

// Adjust according to your environment
const USER_API =
  import.meta.env.MODE === "development"
    ? "http://localhost:8080/api/v1/user/"
    : "/api/v1/user/";

// CSRF token cache
let csrfToken = '';

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

const baseQuery = fetchBaseQuery({
  baseUrl: USER_API,
  credentials: "include",
  prepareHeaders: (headers) => {
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Fetch new CSRF token before any mutation
  if (
    typeof args === "object" &&
    args.method &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(args.method.toUpperCase())
  ) {
    await fetchCsrfToken();
  }

  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    const refreshResult = await baseQuery(
      { url: "refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult?.error) {
      api.dispatch(userLoggedOut());
      return refreshResult;
    }

    result = await baseQuery(args, api, extraOptions);
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (inputData) => ({
        url: "register",
        method: "POST",
        body: inputData,
      }),
    }),
    loginUser: builder.mutation({
      query: (inputData) => ({
        url: "login",
        method: "POST",
        body: inputData,
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(userLoggedIn({ user: result.data.user }));
        } catch (error) {
          console.log("Login failed", error);
        }
      },
    }),
    logoutUser: builder.mutation({
      query: () => ({
        url: "logout",
        method: "POST",
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
          csrfToken = '';
          dispatch(userLoggedOut());
        } catch (error) {
          console.log("Logout failed", error);
        }
      },
    }),
    loadUser: builder.query({
      query: () => ({
        url: "profile",
        method: "GET",
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(userLoggedIn({ user: result.data.user }));
        } catch (error) {
          console.log("Load user failed", error);
        }
      },
    }),
    updateUser: builder.mutation({
      query: (formData) => ({
        url: "profile/update",
        method: "PUT",
        body: formData,
      }),
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "refresh",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useLoadUserQuery,
  useUpdateUserMutation,
  useRefreshTokenMutation,
} = authApi;
