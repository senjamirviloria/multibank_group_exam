import axios from "axios";

const AUTH_API_URL = process.env.AUTH_API_URL || "http://localhost:4001";

export const authHttp = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export { axios };
