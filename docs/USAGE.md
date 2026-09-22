# How to Use Umbra

## What You Need

- A modern browser (Chrome, Brave, or Firefox).
- The [Lace wallet](https://www.lace.io/) extension, set to Preprod, with
  some test tDUST for gas. If you don't have Lace installed, Umbra still
  runs in **local demo mode** — a fully working in-browser ledger — so you
  can try every flow without it.
- Two roles to try both sides of the flow: a **payer** (creates a pool) and
  one or more **recipients** (claim from it). You can play both roles
  yourself in one session.

## Step-by-Step Guide

1. **Open the app** and click **Connect wallet** in the top right. If Lace
   is installed, approve the connection. If it isn't, Umbra assigns you a
   demo identity so you can keep exploring.
2. **Seal a pool** (left-hand panel, "Payer"):
   - Enter the total amount to distribute.
   - Add one row per recipient with their share amount.
   - Umbra shows a live check that the shares add up to the total — this
     is the same rule the circuit enforces on-chain.
   - Click **Seal pool**. This proves the shares sum correctly and writes
     only a commitment hash to the public ledger — never the total or any
     individual amount.
3. **Share the pool ID and each recipient's index/amount off-chain** (e.g.
   in a private message) — exactly as you'd tell someone their salary today.
   Umbra intentionally does not publish this pairing anywhere.
4. **Claim a share** (right-hand panel, "Recipient"):
   - Enter the pool ID, your recipient index, and your share amount.
   - Click **Prove & claim**. This proves you're a valid, unclaimed
     recipient and publishes a one-time nullifier — never your identity or
     amount.
5. **Watch the public ledger** at the bottom of the page update in
   real time: recipient count, claimed count, and a settled/open badge —
   with every amount shown redacted, because the ledger itself never
   receives the real numbers.

## What Gets Proved (and What Stays Private)

| | Public (on the ledger) | Private (never leaves your device) |
|---|---|---|
| Pool creation | Commitment hash, recipient count | Pool total, every individual share, salt |
| Claiming | A one-time nullifier, updated claimed count | Which recipient you are, your exact amount, salt |
| Auditing | Whether a pool is fully settled | — |

## Troubleshooting

- **"recipient shares must sum exactly to the pool total"** — the amounts
  you entered for recipients don't add up to the total. Adjust either side
  until the live check turns green.
- **"this share has already been claimed"** — that recipient index for that
  pool has already been claimed; double-check the pool ID and index with
  whoever set up the pool.
- **"share amount does not match this recipient index"** (local demo mode)
  — the amount you entered doesn't match what the payer committed for that
  index. Confirm the amount off-chain with the payer.
- **Wallet won't connect** — confirm the Lace extension is unlocked and set
  to the Preprod network. Umbra will fall back to local demo mode if no
  wallet is detected, so you can keep working either way.
