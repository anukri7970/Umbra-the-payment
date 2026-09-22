// These tests mirror the exact logic enforced by the Compact circuits in
// contracts/umbra-payroll.compact (createPool's sum assertion, claimPayout's
// nullifier/double-claim guard, and isPoolSettled). They run in plain
// TypeScript so they exercise the same rules the circuit will enforce
// on-chain, without requiring the compactc toolchain in this environment.
import { describe, expect, it, beforeEach } from "vitest";
import {
  createPool,
  claimPayout,
  listPools,
  commitmentHash,
  nullifierHash,
  truncateHash,
  RUNTIME_MODE,
} from "../src/utils/contract";

describe("runtime mode", () => {
  it("defaults to local ledger simulation without a configured contract address", () => {
    expect(RUNTIME_MODE).toBe("local");
  });
});

describe("createPool — mirrors the circuit's sum assertion", () => {
  it("accepts a pool whose shares sum exactly to the declared total", async () => {
    const summary = await createPool(
      { totalAmount: 1000, shares: [600, 300, 100] },
      "wallet:payer-a"
    );
    expect(summary.recipientCount).toBe(3);
    expect(summary.claimedCount).toBe(0);
    expect(summary.settled).toBe(false);
  });

  it("rejects a pool whose shares do not sum to the declared total", async () => {
    await expect(
      createPool({ totalAmount: 1000, shares: [600, 300] }, "wallet:payer-b")
    ).rejects.toThrow(/sum exactly/i);
  });

  it("never exposes the total or individual shares in the public summary", async () => {
    const summary = await createPool(
      { totalAmount: 5000, shares: [2500, 2500] },
      "wallet:payer-c"
    );
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain("5000");
    expect(serialized).not.toContain("2500");
  });
});

describe("claimPayout — mirrors the circuit's nullifier / double-claim guard", () => {
  it("lets a valid recipient claim their share exactly once", async () => {
    const pool = await createPool(
      { totalAmount: 900, shares: [500, 400] },
      "wallet:payer-d"
    );
    const summary = await claimPayout(
      { poolId: pool.poolId, shareAmount: 500, recipientIndex: 0 },
      "wallet:recipient-1"
    );
    expect(summary.claimedCount).toBe(1);
    expect(summary.settled).toBe(false);
  });

  it("marks a pool settled once every recipient has claimed", async () => {
    const pool = await createPool(
      { totalAmount: 300, shares: [200, 100] },
      "wallet:payer-e"
    );
    await claimPayout(
      { poolId: pool.poolId, shareAmount: 200, recipientIndex: 0 },
      "wallet:recipient-2"
    );
    const final = await claimPayout(
      { poolId: pool.poolId, shareAmount: 100, recipientIndex: 1 },
      "wallet:recipient-3"
    );
    expect(final.settled).toBe(true);
  });

  it("rejects a claim whose amount does not match the committed share", async () => {
    const pool = await createPool(
      { totalAmount: 700, shares: [700] },
      "wallet:payer-f"
    );
    await expect(
      claimPayout(
        { poolId: pool.poolId, shareAmount: 999, recipientIndex: 0 },
        "wallet:recipient-4"
      )
    ).rejects.toThrow(/does not match/i);
  });

  it("rejects claims once a pool is already fully settled", async () => {
    const pool = await createPool(
      { totalAmount: 100, shares: [100] },
      "wallet:payer-g"
    );
    await claimPayout(
      { poolId: pool.poolId, shareAmount: 100, recipientIndex: 0 },
      "wallet:recipient-5"
    );
    await expect(
      claimPayout(
        { poolId: pool.poolId, shareAmount: 100, recipientIndex: 0 },
        "wallet:recipient-5"
      )
    ).rejects.toThrow(/already claimed/i);
  });
});

describe("hashing helpers", () => {
  it("produces deterministic commitments for identical inputs", async () => {
    const a = await commitmentHash(1000, 2, "fixed-salt");
    const b = await commitmentHash(1000, 2, "fixed-salt");
    expect(a).toBe(b);
  });

  it("produces different commitments when the salt changes", async () => {
    const a = await commitmentHash(1000, 2, "salt-a");
    const b = await commitmentHash(1000, 2, "salt-b");
    expect(a).not.toBe(b);
  });

  it("produces different nullifiers for different recipient indices", async () => {
    const a = await nullifierHash(0, 0, "wallet:x", "salt");
    const b = await nullifierHash(0, 1, "wallet:x", "salt");
    expect(a).not.toBe(b);
  });

  it("truncates hashes for compact display without losing recognizability", () => {
    const t = truncateHash("abcdef1234567890abcdef1234567890");
    expect(t.startsWith("abcdef")).toBe(true);
    expect(t.endsWith("567890")).toBe(true);
    expect(t).toContain("…");
  });

  it("shows an em-dash placeholder for an empty hash", () => {
    expect(truncateHash("")).toBe("—");
  });
});

describe("listPools", () => {
  beforeEach(() => {
    // local ledger persists across tests by design (mirrors an on-chain
    // ledger's append-only nature within a session) — just assert shape here
  });

  it("returns pool summaries with no private fields present", () => {
    const pools = listPools();
    for (const pool of pools) {
      expect(Object.keys(pool).sort()).toEqual(
        [
          "claimedCount",
          "commitment",
          "payerTag",
          "poolId",
          "recipientCount",
          "settled",
        ].sort()
      );
    }
  });
});
