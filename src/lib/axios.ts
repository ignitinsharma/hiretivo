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
      let responseData = error.response?.data;
      // Text-response endpoints (e.g. streaming JD) deliver error bodies as a JSON string — parse it.
      if (typeof responseData === "string") {
        try {
          responseData = JSON.parse(responseData);
        } catch {
          // leave as-is; falls through to error.message below
        }
      }
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

      // Preserve status + body on the thrown Error so callers that need more
      // than the message (e.g. a 409's echoed existing-record id) can read
      // them without re-parsing — existing `err.message` consumers are unaffected.
      return Promise.reject(
        Object.assign(new Error(message), { status: error.response?.status, data: responseData }),
      );
    }

    return Promise.reject(new Error("An unexpected error occurred"));
  },
);
