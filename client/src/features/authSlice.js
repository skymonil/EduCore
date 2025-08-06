import { createSlice } from "@reduxjs/toolkit";

// Load initial state from localStorage if available
const loadInitialState = () => {
  const storedAuth = localStorage.getItem('auth');
  return storedAuth ? JSON.parse(storedAuth) : {
    user: null,
    isAuthenticated: false,
  };
};

const initialState = loadInitialState();

const authSlice = createSlice({
  name: "authSlice",
  initialState,
  reducers: {
    userLoggedIn: (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('auth', JSON.stringify(state));
    },
    userLoggedOut:(state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('auth');
    }
  },
});

export const {userLoggedIn, userLoggedOut} = authSlice.actions;
export default authSlice.reducer;
