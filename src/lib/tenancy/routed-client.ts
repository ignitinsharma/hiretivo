import type { PrismaClient } from "@/generated/prisma/client";

const operation = Symbol("tenant-operation");
type Operation = { model?: string; method: string; args: unknown[]; owner: Promise<string> };
type Deferred = Promise<unknown> & { [operation]: Operation };
type Target = Record<string, unknown>;

function invoke(client: PrismaClient, task: Operation): unknown {
  const target = (task.model ? (client as unknown as Target)[task.model] : client) as Target;
  return (target[task.method] as (...args: unknown[]) => unknown).apply(target, task.args);
}

/**
 * Resolve identity when operations are created, but keep queries lazy. This
 * preserves Prisma's array transactions: every operation is rebound to the
 * same account client before the actual Prisma transaction is constructed.
 */
export function routedClient(owner: () => Promise<string>, clientFor: (id: string) => PrismaClient, lease?: <T>(id: string, run: (client: PrismaClient) => Promise<T>) => Promise<T>): PrismaClient {
  const use = lease ?? (async <T>(id: string, run: (client: PrismaClient) => Promise<T>) => run(clientFor(id)));
  const defer = (task: Operation): Deferred => {
    let result: Promise<unknown> | undefined;
    const run = () => result ??= task.owner.then((id) => use(id, async (client) => invoke(client, task)));
    return {
      [operation]: task,
      [Symbol.toStringTag]: "PrismaPromise",
      then: (yes, no) => run().then(yes, no),
      catch: (no) => run().catch(no),
      finally: (done) => run().finally(done),
    } as Deferred;
  };
  return new Proxy({} as PrismaClient, {
    get(_, key) {
      if (key === "then") return undefined;
      if (key === "$transaction") return async (tasks: unknown, options?: unknown) => {
        const id = await owner();
        return use(id, async (client) => {
        if (typeof tasks === "function") return client.$transaction(tasks as never, options as never);
        if (!Array.isArray(tasks)) throw new Error("Invalid transaction.");
        const queries = [];
        for (const deferred of tasks as Deferred[]) {
          const task = deferred[operation];
          if (!task || await task.owner !== id) throw new Error("A transaction cannot cross account boundaries.");
          queries.push(invoke(client, task));
        }
        return client.$transaction(queries as never, options as never);
        });
      };
      if (typeof key !== "string") return undefined;
      if (key.startsWith("$")) {
        if (!["$queryRaw", "$queryRawUnsafe", "$executeRaw", "$executeRawUnsafe"].includes(key)) {
          throw new Error(`The hosted data client does not expose ${key}.`);
        }
        return (...args: unknown[]) => defer({ method: key, args, owner: owner() });
      }
      return new Proxy({}, { get: (_model, method) => (...args: unknown[]) =>
        defer({ model: key, method: String(method), args, owner: owner() }) });
    },
  });
}
