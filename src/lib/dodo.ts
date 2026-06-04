import DodoPayments from "dodopayments";

// Lazy DodoPayments client — not initialized at module load time.
// Prevents import-time failures when DODO_API_KEY is absent during
// Next.js build phase, which would crash the build after Prisma generation.
const _globalForDodo = globalThis as unknown as {
  _dodoClient: DodoPayments | undefined;
};

function getDodo(): DodoPayments {
  if (_globalForDodo._dodoClient) return _globalForDodo._dodoClient;

  const bearerToken = process.env.DODO_API_KEY;

  if (!bearerToken) {
    throw new Error("DODO_API_KEY must be set");
  }

  const instance = new DodoPayments({
    bearerToken,
    environment:
      process.env.VERCEL_ENV === "production" ? "live_mode" : "test_mode",
  });

  if (process.env.NODE_ENV !== "production") {
    _globalForDodo._dodoClient = instance;
  }

  return instance;
}

export const dodo = new Proxy({} as DodoPayments, {
  get(_, prop) {
    const instance = getDodo();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
