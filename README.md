# UWI: Universal Web3 Identity

Proof of personhood for Web3. Prove you're a unique human once, privately, with a zero-knowledge passport check from [Self](https://self.xyz). Then any app can recognise you through a soulbound credential, without learning who you are.

**Live on Hedera testnet**

| Contract | Address |
| --- | --- |
| UWIRegistry | [`0xd8EE88623fc33942E554A852530d3CeaB15c39d9`](https://hashscan.io/testnet/contract/0xd8EE88623fc33942E554A852530d3CeaB15c39d9) |
| UWIGates | [`0xC20e25084E041A3638Adb713712888262Daa0C9C`](https://hashscan.io/testnet/contract/0xC20e25084E041A3638Adb713712888262Daa0C9C) |

## How it works

```
Your phone ──proof only──▶ UWI attestor ──nullifier hash──▶ Registry (Hedera) ──yes / no──▶ Any app
```

1. **Self** reads the passport chip on the user's phone and produces a zero-knowledge proof: over 18, plus a *nullifier* derived from the document and UWI's scope.
2. The **attestor** (`frontend/api/self.js`) verifies the proof with Self's backend verifier, then calls the registry.
3. **UWIRegistry** issues one soulbound credential per nullifier. The same passport can't register twice from different wallets, and proving again from a new wallet *recovers* the existing credential onto it.
4. **Apps** ask one question: `isVerifiedHumanStrict(address)` on-chain, `GET /api/v1/humans/:id`, or a **Gate**.

Every user action is gasless. The wallet signs an EIP-712 message, the relayer submits it, and the contract checks the signature, so the relayer can only pay gas, never act for anyone.

## Product

- **Credential:** a holographic card (foil engine adapted from [Arlan Marat's Holo](https://www.arlan.me/vault/holo), MIT) with a unique username, public profile at `/u/:username`, recovery and revocation.
- **Gates:** Sybil-proof allowlists, waitlists and sign-ups. Each human joins once, from any wallet. Builders get a share link, a QR code, a live join chart, and CSV or JSON export.
- **Developers:** REST API, contract calls and a live lookup tool at `/developers`.
- **Demo mode (testnet):** try everything without a passport. Demo credentials are marked on-chain and fail strict checks.

## Repository

| Path | What |
| --- | --- |
| `contracts/` | Foundry project: `UWIRegistry`, `UWIGates`, tests, deploy script |
| `frontend/` | React + Vite + Tailwind app, plus the serverless API in `frontend/api` |

See each folder's README to run, test and deploy.

## Trust model

The registry owner decides which addresses are attestors, so users and apps trust the attestor to have checked each Self proof. Everything else is enforced on-chain: one credential per nullifier, one per wallet, no transfers, signature checks on every gasless write. Self's verifier contracts live on Celo, which is why verification happens off-chain here.
