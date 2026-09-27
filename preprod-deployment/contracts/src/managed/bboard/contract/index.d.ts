import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  poolTotal(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  recipientShares(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint[]];
  recipientCountWitness(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  commitSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  callerSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  claimShareAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  claimRecipientIndex(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  claimSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  createPool(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, bigint>;
  claimPayout(context: __compactRuntime.CircuitContext<PS>, poolId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  isPoolSettled(context: __compactRuntime.CircuitContext<PS>, poolId_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  createPool(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, bigint>;
  claimPayout(context: __compactRuntime.CircuitContext<PS>, poolId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  isPoolSettled(context: __compactRuntime.CircuitContext<PS>, poolId_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  createPool(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, bigint>;
  claimPayout(context: __compactRuntime.CircuitContext<PS>, poolId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  isPoolSettled(context: __compactRuntime.CircuitContext<PS>, poolId_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
}

export type Ledger = {
  readonly poolCount: bigint;
  poolCommitment: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  poolRecipientCount: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  poolClaimedCount: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  claimedNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
