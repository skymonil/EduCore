import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedOut } from "../src/features/authSlice"; // Adjust path if needed

/**
 * Creates a base query that handles token reauthentication on a 401 error.
 * This is a factory function that allows each API slice to define its own base URL.
 * * @param {string} baseUrl The base URL for the API endpoints.
 * @returns {Function} The configured base query function.
 */
export const createBaseQueryWithReauth = (baseUrl) => {
  // The standard fetchBaseQuery for the specific API slice
  const baseQuery = fetchBaseQuery({
    baseUrl: baseUrl,
    credentials: "include",
  });

  // The wrapper function for reauthentication
  return async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result?.error?.status === 401) {
      console.log("Reauthentication needed. Attempting to refresh token...");
      
      // Attempt to refresh the token using a specific endpoint relative to the root API
      // Note: The base URL for the refresh call is /api/v1/user/refresh, so we create a new baseQuery instance for this specific call.
      const refreshBaseQuery = fetchBaseQuery({
        baseUrl: import.meta.env.MODE === "development" ? "http://localhost:8080/api/v1/" : "/api/v1/",
        credentials: "include",
      });
      const refreshResult = await refreshBaseQuery("user/refresh", api, extraOptions);

      if (refreshResult?.error) {
        // Refresh failed, log the user out
        console.log("Token refresh failed. Logging user out.");
        api.dispatch(userLoggedOut());
        return refreshResult;
      }

      // Retry the original query with the new token
      console.log("Token refresh successful. Retrying original request...");
      result = await baseQuery(args, api, extraOptions);
    }

    return result;
  };
};

export default createBaseQueryWithReauth;
