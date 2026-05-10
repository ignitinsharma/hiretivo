import DodoPayments from "dodopayments";

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
  environment:
    process.env.VERCEL_ENV === "production" ? "live_mode" : "test_mode",
});
