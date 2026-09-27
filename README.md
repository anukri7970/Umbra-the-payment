# Umbra

![CI](https://github.com/YOUR_GITHUB_USERNAME/umbra-payroll/actions/workflows/ci.yml/badge.svg)

> Confidential payroll and revenue splits: prove every share adds up, without ever showing who got what.

## Live Demo & Walkthrough

* 🌐 **Live DApp:** [https://umbra-the-payment.vercel.app](https://umbra-the-payment.vercel.app)
* 🎥 **Video Walkthrough:** [Watch the demo on Google Drive](https://drive.google.com/file/d/1HitWlEBr3wZ0YimV3IULD8aNofJOe42N/view?usp=sharing)

## Contract Address

| Network | Address |
| Preprod | `4e73af2c0626a1d17de2452dc11e80a0f285bdb25fe88e82d5b8b2a8fa87d5e0` |

**View on Midnight Explorer**
[Contract 0x4e73af2c… | Midnight Explorer](https://preprod.midnightexplorer.com/contracts/0x4e73af2c0626a1d17de2452dc11e80a0f285bdb25fe88e82d5b8b2a8fa87d5e0)

**Example Transaction (1AM Explorer)**
[9be7773f4ac661a799352325c6524dbff7807cae4dc4207c17aa3fc23ea5dd8a](https://explorer.1am.xyz/tx/9be7773f4ac661a799352325c6524dbff7807cae4dc4207c17aa3fc23ea5dd8a?network=preprod)

## What This Product Does

Umbra is a confidential payroll and revenue-split dApp built on Midnight.
DAOs, freelance collectives, and revenue-share agreements currently have to
choose between paying everyone through a public ledger — exposing every
contributor's exact compensation — or moving payroll off-chain entirely and
losing verifiability. Umbra removes that tradeoff.

A payer commits a total payout pool and a set of per-recipient shares. A
Compact circuit proves the shares sum exactly to the committed total before
anything is written to the ledger — but only a commitment hash is ever
published, never the total or any individual amount. Recipients later prove
they belong to the pool and haven't claimed before; a one-time nullifier is
published so a share can never be double-claimed, but the claimant's
identity and amount stay private.

Anyone can build on Midnight, so a public payroll trail wouldn't just be
awkward — it would be a permanent, unerasable compensation leak. Umbra is
built for teams (DAOs, distributed agencies, revenue-share collectives) who
want the trustlessness of an on-chain payout with none of the disclosure.

## Privacy Model

- **What is PUBLIC (on-chain, anyone can see):**
  - The number of payout pools created.
  - Each pool's commitment hash (a hash of the total, recipient count, and
    a random salt — not reversible to the real amounts).
  - Each pool's recipient count and how many shares have been claimed.
  - A one-time nullifier per claim (proves a share was claimed exactly
    once, without identifying who claimed it).
  - Whether a pool is fully settled.
- **What is PRIVATE (private witness, never on-chain):**
  - The real pool total.
  - Every individual recipient's share amount.
  - Which recipient index a given claim corresponds to.
  - The salts used to build every commitment and nullifier.
- **What the user PROVES without revealing:**
  - That a pool's recipient shares sum exactly to its committed total
    (`createPool`).
  - That the caller is a valid, not-yet-paid recipient of a given pool
    (`claimPayout`) — without revealing which recipient, or the amount.
  - That a pool is correctly and fully settled, auditable by anyone with
    zero disclosure of individual compensation (`isPoolSettled`).

## Tech Stack

- **Contract:** Compact (Midnight smart contract language)
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Wallet:** Lace (Midnight wallet connector), with a local demo-ledger
  fallback so the UI is fully explorable without a wallet installed
- **Testing:** Vitest — unit tests mirroring the circuits' sum, nullifier,
  and settlement logic
- **CI/CD:** GitHub Actions (lint, typecheck, test, build, best-effort
  Compact compile)

## Prerequisites

- [Lace wallet](https://www.lace.io/) browser extension, set to Preprod
- Node.js v22+
- Docker (required by the Midnight Compact toolchain for local proving)
- The [Compact compiler](https://docs.midnight.network) (`compactc` /
  `compact compile`) installed locally to compile `contracts/umbra-payroll.compact`

## Setup & Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_GITHUB_USERNAME/umbra-payroll.git
cd umbra-payroll

# 2. Install frontend dependencies
npm install

# 3. (Optional) point the app at a deployed contract — otherwise it runs
#    in a local demo-ledger mode that mirrors the circuits exactly
cp .env.example .env
# edit .env and set VITE_CONTRACT_ADDRESS after you deploy (see below)

# 4. Compile the contract (requires the Compact toolchain + Docker)
compact compile contracts/umbra-payroll.compact managed/

# 5. Run the frontend
npm run dev
```

### Deploy to Preprod

```bash
# From the project root, after compiling:
compact deploy contracts/umbra-payroll.compact \
  --network preprod \
  --wallet <your-lace-wallet-address>
```

Paste the resulting contract address into the **Contract Address** table
above and into `.env` as `VITE_CONTRACT_ADDRESS`.

## Run Tests

```bash
npm test
```

14 tests cover: the sum-must-equal-total rule enforced by `createPool`, the
nullifier/double-claim guard enforced by `claimPayout`, settlement logic,
and the hashing helpers used to build commitments — mirroring the circuit
logic in `contracts/umbra-payroll.compact` exactly.

## CI/CD

Every push to `main` and every pull request runs, via
[`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`
6. A best-effort Compact compile step (runs when `compactc` is available)

## Usage Guide

See [`docs/USAGE.md`](docs/USAGE.md) for a full walkthrough: sealing a pool,
sharing claim details off-chain, claiming a share, and reading the public
ledger.

## Project History

Built for the Midnight Builder Challenge. See [`PROPOSAL.md`](PROPOSAL.md)
for the original Level 3 idea submission this MVP implements.
