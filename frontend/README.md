# UWI frontend and API

React 18, Vite, Tailwind v4, React Three Fiber, wagmi with Reown AppKit, Radix primitives, Motion. The `api/` folder holds the serverless functions (attestor, relayer, public REST API). On Vercel they deploy as functions; in development `npm run dev` serves them through `dev/api-plugin.js`.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # app and /api on http://localhost:5173
npm run lint
npm run build
```

## Environment

| Variable | Where | What |
| --- | --- | --- |
| `VITE_REOWN_PROJECT_ID` | client | Reown project for the wallet modal. Allowlist every domain you serve from in the [Reown dashboard](https://dashboard.reown.com). |
| `VITE_CHAIN_ID` | server | Chain the API sends transactions on. Default `296` (Hedera testnet). The app itself targets Hedera testnet (`src/config/chain.js`); moving to mainnet needs that file changed too. |
| `VITE_REGISTRY_ADDRESS`, `VITE_GATES_ADDRESS` | both | Contract addresses. Default to the live testnet deployment. |
| `ATTESTOR_PRIVATE_KEY` | **server only** | Key with the attestor role. Issues credentials and pays all relayed gas, so keep it funded with HBAR. Never prefix with `VITE_`, never commit it. |
| `VITE_SELF_ENDPOINT` | both | Public URL of `api/self.js`, e.g. `https://your-app.vercel.app/api/self`. Empty disables passport verification. Self's relayer calls it, so it can't be localhost. |
| `VITE_SELF_ENDPOINT_TYPE` | both | `staging_https` accepts Self mock passports, `https` real ones. |
| `VITE_SELF_SCOPE` | both | Self scope, at most 31 ASCII characters. Changing it changes every nullifier. |
| `DEMO_ISSUANCE` | server | `true`/`false`. Unset: on for testnet, off for mainnet. |
| `RPC_URL`, `MIRROR_NODE_URL` | server | Optional overrides for Hashio and the Hedera mirror node. |

`VITE_*` values are compiled into the client bundle, so they are public. Only `ATTESTOR_PRIVATE_KEY` is secret.

## API

| Route | |
| --- | --- |
| `GET /api/v1/humans/:id` | Address or username: verified, proof type, token, dates. Edge-cached 15s. |
| `GET /api/v1/gates/:id` | Gate and members; `?format=csv` downloads. Edge-cached 10s. |
| `GET /api/status` | Contracts, relayer address and balance, enabled verification paths |
| `POST /api/self` | Called by Self's relayer with the proof |
| `POST /api/demo` | Signed request for a testnet demo credential |
| `POST /api/relay` | Signed `join`, `createGate`, `closeGate`, `revoke` |

Errors are always `{ error: { code, message } }`. Hedera notes baked into `api/_lib/chain.js`: transactions are legacy-priced from `eth_gasPrice`, gas estimates get a 1.5x margin (Hedera ignores storage refunds when estimating), every write is simulated first so reverts cost nothing, and confirmations poll both Hashio and the mirror node.

## The landing experience

`/` is a seven-chapter WebGL story that sits above the product page (`src/pages/Landing.jsx`, `src/experience/`).

- **Scroll:** `useChapters.js` turns wheel, touch and keys into one chapter per gesture (trackpad inertia is filtered by `wheelIntent.js`) and springs a single `progress` value that every scene object reads. Past the last chapter the page scrolls natively and the story fades under it.
- **Scene:** `scene/` holds the hero print (points along the same ridges as the card's print), the swarm (Keplerian orbits, lensed per vertex), a ray-traced Schwarzschild black hole, the supernova (its own reversible clock, so it plays out in full in both directions), the nebula, the credential and the closing galaxy.
- **Loading:** the preloader follows real milestones from `experience/loading.js`: fonts, the scene chunk, the WebGL context, every shader compiled up front (`compileAsync`, including objects that start hidden, so nothing compiles mid-story), then a few smooth frames. It shows a stall notice after 12s with a way to continue.
- **Fallbacks:** no WebGL, a scene error, or a GPU context that stays lost all fall back to a static backdrop with the full story text. Reduced motion is respected throughout.
- **Performance:** device pixel ratio is capped (1.5 desktop, 1.25 phones) and lowered automatically when frames drop. The wallet stack is lazy-loaded, so the landing's entry bundle is about 160 KB gzipped; the 3D chunk loads in parallel with first paint.

## Layout

```
api/                  serverless functions (Vercel)
dev/api-plugin.js     serves api/ during `npm run dev`
src/config/           chain, ABIs and EIP-712 types (shared with api/), AppKit, Self
src/experience/       landing story: chapters, scroll controller, loading, overlay copy, sound
src/experience/scene/ the WebGL scene
src/components/holo/  holographic card: engine, CSS layer stack, generated print
src/components/       UI kit (Radix-based), layout shells, diagrams, chart
src/hooks/            contract reads, gasless actions, gate data
src/pages/            landing, onboarding, profile, gate join, developers, app/*
src/web3/             lazily loaded wallet providers
```

## Deploy on Vercel

1. Import the repository and set **Root Directory** to `frontend`. Vercel detects Vite: build `npm run build`, output `dist`.
2. Add the variables above under **Settings → Environment Variables**, at least `VITE_REOWN_PROJECT_ID` and `ATTESTOR_PRIVATE_KEY`. Mark the attestor key as **Sensitive**. Add them to Preview too if you want preview deployments to issue credentials.
3. Deploy, then set `VITE_SELF_ENDPOINT` to `https://<your-domain>/api/self` and redeploy (`VITE_*` values are baked in at build time).
4. In the Reown dashboard, allowlist the production domain (and `*.vercel.app` if you use previews).
5. Fund the attestor address with HBAR. `GET /api/status` shows its address and balance.

`vercel.json` already rewrites every non-API path to the SPA, gives API functions 60 seconds (Hedera confirmations can take a while), caches hashed assets for a year and sets baseline security headers.
