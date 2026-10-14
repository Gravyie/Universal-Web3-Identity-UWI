# UWI — frontend

React + Vite + Tailwind v4 app for Universal Web3 Identity: connect a wallet, pick a username, prove personhood with Self, and mint a soulbound credential on Hedera testnet.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

| Variable | What it's for |
| --- | --- |
| `VITE_REOWN_PROJECT_ID` | Reown AppKit project (wallet modal, WalletConnect). Add your domains to its allowlist. |
| `VITE_UWI_CONTRACT_ADDRESS` | `UniversalWebIdentity` on Hedera testnet (chain 296). |
| `VITE_SELF_ENDPOINT` | Public https URL of `api/verify.js`, e.g. `https://your-app.vercel.app/api/verify`. Empty → demo verification only. |
| `VITE_SELF_ENDPOINT_TYPE` | `staging_https` (accepts Self mock passports) or `https` (real documents). |
| `VITE_SELF_SCOPE` | Self scope, ≤31 ASCII chars. Must be identical on frontend and backend. |
| `VITE_ALLOW_DEMO_VERIFY` | `true` shows "Simulate proof" in production builds. Always on in dev and when no endpoint is set. |

Self's relayer calls `VITE_SELF_ENDPOINT` directly, so it can't be `localhost`. During development, deploy once to Vercel or run an ngrok tunnel.

## Deploy

Built for Vercel: `vercel.json` handles SPA routing, and `api/verify.js` becomes the Self verification function. Set the same env vars in the Vercel project.

## Contract

Hedera testnet gets wiped from time to time. If the app shows the "No UWI contract found" banner, redeploy from `../contracts`:

```bash
forge script script/Deploy.s.sol --rpc-url https://testnet.hashio.io/api --broadcast
```

Then update `VITE_UWI_CONTRACT_ADDRESS`.

## Layout

```
api/verify.js            Self backend verifier (Vercel function)
src/config/              wagmi/AppKit, contract ABI + address, Self settings
src/theme/               Ink/Paper modes × four accents, synced into the wallet modal
src/components/          IdentityCard, Guilloche, header, UI primitives
src/pages/               Home, Create (+ create/ steps), Credential, Lookup
src/hooks/useIdentity.js contract reads for a wallet's credential
```
