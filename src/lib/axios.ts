import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      const message =
        typeof responseData === "object" &&
        responseData !== null &&
        "error" in responseData
          ? String(responseData.error)
          : typeof responseData === "object" &&
              responseData !== null &&
              "message" in responseData
            ? String(responseData.message)
            : error.message || "An unexpected error occurred";

      return Promise.reject(new Error(message));
    }

    return Promise.reject(new Error("An unexpected error occurred"));
  },
);
