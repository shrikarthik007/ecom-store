/* eslint-disable no-unused-vars */
import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";
import axiosInstance from "../lib/axios";

export const useUserStore = create((set, get) => ({
  User: null,
  loading: false,
  checkingAuth: true,
  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });
    console.log("Request sent to:", axios.defaults.baseURL || "Direct URL");

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      console.log(
        "Request sent to:",
        `${axiosInstance.defaults.baseURL}/auth/signup`
      );
      const res = await axios.post("/api/auth/signup", {
        name,
        email,
        password,
      });

      set({ user: res.data, loading: false });
      toast.success("Account created successfully");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.message || "An error occurred");
    }
  },
}));

// export default useUserStore;
