import { mintApplyReservationHandle, consumeApplyReservationHandle } from "@/lib/billing/ai-daily-limit";

/*
 * main
 * Real-Redis proof that the reservation-handle flow (added to close the
 * client-controlled-boolean quota bypass) behaves correctly: a handle
 * redeems exactly once, replays fail, handles don't cross users, and bogus
 * handles are rejected. Every handle either gets consumed by this run or
 * expires on its own short TTL — no cleanup needed.
 */
async function main(): Promise<void> {
  const userId = `handle-test-${Date.now()}`;
  const otherUserId = `handle-test-other-${Date.now()}`;

  const handle = await mintApplyReservationHandle(userId);
  console.log("minted:", handle);

  const wrongUser = await consumeApplyReservationHandle(otherUserId, handle);
  console.log("wrong user (expect false):", wrongUser);
  if (wrongUser) throw new Error("handle redeemed by the wrong user");

  const bogus = await consumeApplyReservationHandle(userId, "not-a-real-handle");
  console.log("bogus handle (expect false):", bogus);
  if (bogus) throw new Error("bogus handle was accepted");

  const first = await consumeApplyReservationHandle(userId, handle);
  console.log("first consume (expect true):", first);
  if (!first) throw new Error("valid handle was rejected");

  const replay = await consumeApplyReservationHandle(userId, handle);
  console.log("replay after consume (expect false):", replay);
  if (replay) throw new Error("handle was redeemed twice — billing bypass");

  console.log("\nAll apply-reservation-handle invariants held.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
