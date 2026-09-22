// Umbra Payroll Contract — Witness implementations
// These provide the private (off-chain) inputs to the ZK circuits.
// Matching the witness declarations in umbra-payroll.compact:
//
//   witness poolTotal(): Uint<64>;
//   witness recipientShares(): Vector<32, Uint<64>>;
//   witness recipientCountWitness(): Uint<32>;
//   witness commitSalt(): Bytes<32>;
//   witness callerSecretKey(): Bytes<32>;
//   witness claimShareAmount(): Uint<64>;
//   witness claimRecipientIndex(): Uint<32>;
//   witness claimSalt(): Bytes<32>;

import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

// Private state held by the caller — never leaves the client
export type UmbraPrivateState = {
  readonly callerSecretKey: Uint8Array; // 32-byte caller identity secret
  readonly poolTotal: bigint;
  readonly recipientShares: bigint[];    // up to 32 entries
  readonly recipientCount: number;
  readonly commitSalt: Uint8Array;       // 32-byte random salt
  readonly claimShareAmount: bigint;
  readonly claimRecipientIndex: number;
  readonly claimSalt: Uint8Array;        // 32-byte random salt
};

export const createUmbraPrivateState = (overrides: Partial<UmbraPrivateState> = {}): UmbraPrivateState => ({
  callerSecretKey: new Uint8Array(32),
  poolTotal: 0n,
  recipientShares: Array(32).fill(0n),
  recipientCount: 0,
  commitSalt: new Uint8Array(32),
  claimShareAmount: 0n,
  claimRecipientIndex: 0,
  claimSalt: new Uint8Array(32),
  ...overrides,
});

export const witnesses = {
  poolTotal: ({ privateState }: WitnessContext<any, UmbraPrivateState>): [UmbraPrivateState, bigint] =>
    [privateState, privateState.poolTotal],

  recipientShares: ({ privateState }: WitnessContext<any, UmbraPrivateState>): [UmbraPrivateState, bigint[]] =>
    [privateState, privateState.recipientShares],

  recipientCountWitness: ({ privateState }: WitnessContext<any, UmbraPrivateState>): [UmbraPrivateState, number] =>
    [privateState, privateState.recipientCount],

  commitSalt: ({ privateState }: WitnessContext<any, UmbraPrivateState>): [UmbraPrivateState, Uint8Array] =>
    [privateState, privateState.commitSalt],

  callerSecretKey: ({ privateState }: WitnessContext<any, UmbraPrivateState>): [UmbraPrivateState, Uint8Array] =>
    [privateState, privateState.callerSecretKey],

  claimShareAmount: ({ privateState }: WitnessContext<any, UmbraPrivateState>): [UmbraPrivateState, bigint] =>
    [privateState, privateState.claimShareAmount],

  claimRecipientIndex: ({ privateState }: WitnessContext<any, UmbraPrivateState>): [UmbraPrivateState, number] =>
    [privateState, privateState.claimRecipientIndex],

  claimSalt: ({ privateState }: WitnessContext<any, UmbraPrivateState>): [UmbraPrivateState, Uint8Array] =>
    [privateState, privateState.claimSalt],
};
