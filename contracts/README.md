# UWI contracts

Foundry project. Solidity 0.8.24, OpenZeppelin 5, targeting Cancun (supported by Hedera).

- **`UWIRegistry`**: soulbound ERC-721 (ERC-5192 locked). One credential per Self nullifier and per wallet, unique lowercase usernames, attestor-only `issue` and `recover`, holder `revoke` and gasless `revokeBySig`. `isVerifiedHuman` accepts any credential; `isVerifiedHumanStrict` only Self-backed ones.
- **`UWIGates`**: lists that admit each credential once. Creators must be verified humans. `createGate`, `join` and `close` each have an EIP-712 `…BySig` twin for gasless use.

```bash
forge test                    # 18 tests
forge fmt --check

# Deploy (deployer becomes owner and, unless ATTESTOR is set, the attestor)
cp .env.example .env          # PRIVATE_KEY of a funded testnet account (optional ATTESTOR)
set -a && . ./.env && set +a
forge script script/Deploy.s.sol --rpc-url hedera_testnet --broadcast --slow
```

Get test HBAR from the [Hedera faucet](https://portal.hedera.com/faucet). After deploying:

1. Set `VITE_REGISTRY_ADDRESS` and `VITE_GATES_ADDRESS` in the frontend (and in Vercel).
2. Set the frontend's `ATTESTOR_PRIVATE_KEY` to the attestor's key and fund that address with HBAR; it pays for every issued credential and relayed action.
3. The owner can add or remove attestors with `setAttestor(address, bool)`.

`.env` is git-ignored. Never commit a key, and treat any key that has ever been committed as compromised.
