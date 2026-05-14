# Manual verification bundle (explorer.0g.ai)

> This folder is a manual-submission bundle for `explorer.0g.ai/mainnet/verify-contract`.
> `chainscan.0g.ai` is already verified for all 4 contracts via the documented
> automated path. This bundle exists ONLY for the secondary explorer's
> interactive form.

## Step-by-step (per contract, 4× total)

1. Visit https://explorer.0g.ai/mainnet/verify-contract
2. Fill the first page:
   - **Enter contract address**: see Address column below
   - **Select Compiler Type**: `Solidity (Single file)` if you'll paste the `.flat.sol`,
     or `Solidity (Standard-JSON-Input)` if you'll paste the `.input.json`. Either works
     equally for verification; flat source is human-readable, standard-JSON preserves
     the multi-file structure.
   - **Select Compiler Version**: `v0.8.34+commit.80d5c536`
   - **Select Open Source License Type**: `MIT License (MIT)`
   - Click **Continue**.
3. Fill the second page:
   - **Optimization Enabled**: `Yes`
   - **Runs**: `200`
   - **EVM Version**: `cancun`
   - **Via IR**: `Yes` (or check the equivalent toggle)
   - **Contract Code**: paste the contents of the corresponding `.flat.sol` (or
     `.input.json` if you picked standard-JSON in step 2)
   - **Constructor Arguments (ABI-encoded)**: paste exactly the hex string from
     the table below (NO `0x` prefix needed on most Blockscout forms; include `0x`
     if the form refuses)
4. Submit. Wait ~10 seconds for "Successfully verified" confirmation.

## Per-contract field values

| Contract | Address | File to paste | Constructor args (ABI-encoded) |
|---|---|---|---|
| **Brain** | `0x4E5c6DC869F9B3220F01de9047031cEd1577b08F` | `Brain.flat.sol` | `0x000000000000000000000000d24e06f0dbada268314dbcb97f48f87b85b6dd30` |
| **BrainOracle** | `0x923A0b7f21c57d92BFa8AA6721b574f47Fe5C5C0` | `BrainOracle.flat.sol` | `0x000000000000000000000000d24e06f0dbada268314dbcb97f48f87b85b6dd30000000000000000000000000d24e06f0dbada268314dbcb97f48f87b85b6dd30` |
| **BrainMinter** | `0x3e7D22150d6b883a89703d760d66743D2223456b` | `BrainMinter.flat.sol` | `0x0000000000000000000000004e5c6dc869f9b3220f01de9047031ced1577b08f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d24e06f0dbada268314dbcb97f48f87b85b6dd30` |
| **RoyaltyDistributor** | `0x7F26DeDe0c5E1Db844c9A8138C21cA3439B63C49` | `RoyaltyDistributor.flat.sol` | `0x0000000000000000000000004e5c6dc869f9b3220f01de9047031ced1577b08f` |

## Settings (same for all 4)

- Compiler: `v0.8.34+commit.80d5c536`
- Optimizer enabled: `Yes`
- Runs: `200`
- EVM Version: `cancun`
- Via IR: `Yes`
- License: `MIT`

## How the files were generated

```bash
cd contracts
# Flat (single-file) source
forge flatten src/Brain.sol            > verification-bundle/Brain.flat.sol
forge flatten src/BrainOracle.sol      > verification-bundle/BrainOracle.flat.sol
forge flatten src/BrainMinter.sol      > verification-bundle/BrainMinter.flat.sol
forge flatten src/RoyaltyDistributor.sol > verification-bundle/RoyaltyDistributor.flat.sol

# Standard JSON Input (preserves the multi-file structure + every setting)
ZG_EXPLORER_API_KEY=PLACEHOLDER forge verify-contract \
  --chain-id 16661 --num-of-optimizations 200 --compiler-version 0.8.34 \
  --evm-version cancun --via-ir --show-standard-json-input \
  <ADDRESS> src/Brain.sol:Brain > verification-bundle/Brain.input.json
# ...repeat for each contract
```

## If verification fails

Most common cause: the form silently skips the **Via IR** toggle. Without
`viaIR: true`, the compiler produces different bytecode and verification mismatches.

If the form has no Via IR option, use the `.input.json` files instead. They carry
the viaIR flag baked into the JSON.

If still failing, fall back to `chainscan.0g.ai/v1/contract/<address>` which has
the verified source (exactMatch=true) in the official 0G chainscan database.
