# Umbra — Confidential Payroll & Revenue Splits

**Category:** Payments
**Level 3 idea list item:** Private Payroll / Splits

## Problem

DAOs, freelance collectives, and revenue-share agreements need to pay
multiple people from a shared pool, but today they're forced into a bad
tradeoff: pay through a public ledger and expose every contributor's exact
compensation to competitors, clients, and each other — or move payroll
off-chain entirely and lose verifiability, auditability, and trustlessness.
Neither option is acceptable for teams that want both privacy and provable
correctness.

## Solution

Umbra is a confidential payroll/split-payment dApp built on Compact. A payer
commits a total payout pool and a set of per-recipient shares as hidden
values. A Compact circuit proves that the individual amounts sum exactly to
the committed total and match the agreed distribution — without revealing
any individual amount on-chain. Recipients can independently and privately
prove they were paid (e.g. for tax or audit purposes) without disclosing the
amount to anyone else. Payouts are tied to nullifiers so a claim can't be
duplicated or forged. Only the aggregate pool size and a validity proof are
ever public; individual compensation stays confidential.

## Why it matters

This solves a real, recurring operational pain point (compensation privacy)
rather than serving as a purely illustrative demo — giving it a concrete
adoption path among DAOs and distributed teams already using on-chain
payments.

## Privacy model (summary — see README for the full breakdown)

- **Public:** pool commitment hash, recipient count, claimed count,
  settlement status, claim nullifiers.
- **Private:** pool total, every individual share amount, which recipient a
  claim belongs to, all commitment/claim salts.
- **Proved without disclosure:** that shares sum exactly to the pool total,
  and that a claim is valid and has not been made before.
