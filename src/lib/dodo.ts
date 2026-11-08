import DodoPayments from "dodopayments";

let client: DodoPayments | undefined;

/*
 * getDodo
 * Creates the hosted billing client only when a billing route actually uses it.
 * @returns configured DodoPayments client
 */
function getDodo(): DodoPayments {
  if (!client) {
    client = new DodoPayments({
      bearerToken: process.env.DODO_API_KEY!,
      environment:
        process.env.VERCEL_ENV === "production" ? "live_mode" : "test_mode",
    });
  }
  return client;
}

export const dodo = new Proxy({} as DodoPayments, {
  get(_target, property) {
    const value = Reflect.get(getDodo(), property);
    return typeof value === "function" ? value.bind(getDodo()) : value;
  },
});
