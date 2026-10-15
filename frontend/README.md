# UWI frontend and API

React 18, Vite, Tailwind v4, wagmi with Reown AppKit, Radix primitives, Motion. The `api/` folder holds the serverless functions (attestor, relayer, public REST API). On Vercel they deploy as functions; in development `npm run dev` serves them through `dev/api-plugin.js`.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # app and /api on http://localhost:5173
```

| Variable | Where | What |
| --- | --- | --- |
| `VITE_REOWN_PROJECT_ID` | client | Reown project for the wallet modal. Allowlist your domains in the Reown dashboard. |
| `VITE_REGISTRY_ADDRESS`, `VITE_GATES_ADDRESS` | both | Contract addresses on Hedera testnet. |
| `ATTESTOR_PRIVATE_KEY` | **server only** | Key with the attestor role. Pays all gas, so keep it funded with HBAR. Never prefix with `VITE_`. |
| `VITE_SELF_ENDPOINT` | both | Public URL of `api/self.js`, e.g. `https://your-app.vercel.app/api/self`. Empty disables passport verification. Self's relayer calls it, so it can't be localhost. |
| `VITE_SELF_ENDPOINT_TYPE` | both | `staging_https` accepts Self mock passports, `https` real ones. |
| `VITE_SELF_SCOPE` | both | Self scope, at most 31 ASCII characters. |
| `DEMO_ISSUANCE` | server | `false` turns off demo credentials. |
| `RPC_URL`, `MIRROR_NODE_URL` | server | Optional overrides for Hashio and the Hedera mirror node. |

## API

| Route | |
| --- | --- |
| `GET /api/v1/humans/:id` | Address or username: verified, proof type, token, dates |
| `GET /api/v1/gates/:id` | Gate and members; `?format=csv` downloads |
| `GET /api/status` | Contracts, relayer health, enabled verification paths |
| `POST /api/self` | Called by Self's relayer with the proof |
| `POST /api/demo` | Signed request for a testnet demo credential |
| `POST /api/relay` | Signed `join`, `createGate`, `closeGate`, `revoke` |

Errors are always `{ error: { code, message } }`. Hedera notes baked into `api/_lib/chain.js`: transactions are legacy-priced from `eth_gasPrice`, gas estimates get a 1.5x margin (Hedera ignores storage refunds when estimating), and confirmations poll both Hashio and the mirror node.

## Layout

```
api/                  serverless functions (Vercel)
dev/api-plugin.js     serves api/ during `npm run dev`
src/config/           chain, ABIs and EIP-712 types (shared with api/), AppKit, Self
src/components/holo/  holographic card: engine, CSS layer stack, generated print
src/components/       UI kit (Radix-based), layout shells, diagrams, chart
src/hooks/            contract reads, gasless actions, gate data
src/pages/            landing, onboarding, profile, gate join, developers, app/*
```

## Deploy

Vercel, with this folder as the project root. `vercel.json` routes everything except `/api` to the SPA. Set the variables above in the Vercel project, then set `VITE_SELF_ENDPOINT` to the deployed `/api/self` URL and redeploy.
