# tinyman-ts-sdk
Tinyman Typescript SDK


## Design Goal
This SDK is designed for automated interaction with the Tinyman AMM. It will be most useful for developers who wish to create automated trading programs/bots. It may also be useful to create an alternative UI but that is not a design goal of this library.
It is designed to be reasonably low level so that pieces can be used in isolation. 

## Status
This SDK is currently under active early development and should not be considered stable.

The SDK has been updated for Tinyman V1.1.

## Support Development
If you'd like to support the development of this SDK, you can send ALGO or a coffee
[![my-algo](https://upload.wikimedia.org/wikipedia/commons/5/50/Algorand_mark.svg)](https://wallet.myalgo.com/)
`DFL62FKU5OYG54Y5FRJ3JWAUQ27Y7PTA4HTNXOE6KCZRRHKDWGIOQWKNMA`

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/F2F7AQ051)


## Installation
Package will be available on `npm` on February 23rd 20:00 JST (2022/02/02 11:00 UTC)
<!-- Need to wait on February 23rd 2022 to re-publish to NPM. Messed up the first upload.
tinyman-ts-sdk is available on `npm`. :
`npm i tinyman-ts-tsk` 
-->


## Sneak Preview

```typescript
import algosdk from "algosdk";
import { Asset,TinymanMainnetClient } from "./../index.js";

const MNEMONIC = '<YOUR MNEMONIC HERE>';
const ACCOUNT = algosdk.mnemonicToSecretKey(MNEMONIC);
const WALLET_ADDRESS = ACCOUNT.addr;
const SECRET_KEY = ACCOUNT.sk;

const client = new algosdk.Algodv2('','https://api.algoexplorer.io','',{'user-agent':'algo-sdk'});

//Initialize Tinyman's Mainnet Client
const TinymanClient = new TinymanMainnetClient(client,WALLET_ADDRESS);

//Fetch the Assets from the network
const A1 = await new Asset(0).fetch(client);       //ALGO
const A2 = await new Asset(31566704).fetch(client); //USDC

//Get the Pool for this Asset pair
const POOL = await TinymanClient.fetch_pool(A1,A2,true);

//Get a Fixed Input Swap Quote
const FIXED_INPUT_SWAP = await POOL.fetch_fixed_input_swap_quote(A1.AssetAmount(1000000),0.01);

//Prepare the Swap Transactions
const TXNS = await POOL.prepare_swap_transactions(
    FIXED_INPUT_SWAP.amount_in_with_slippage(),
    FIXED_INPUT_SWAP.amount_out_with_slippage(),
    'fixed-input',
    WALLET_ADDRESS
);

//Sign the Transactions
TXNS.sign_with_private_key(WALLET_ADDRESS,SECRET_KEY);

//Submit the transactions and wait for confirmation
await TXNS.submit(client,true);
# See the examples for the rest...

```

## Examples

TODO


## Conventions

* Methods starting with `fetch_` all make network requests to fetch current balances/state.
* Methods of the form `prepare_X_transactions` all return `TransactionGroup` objects (see below).
* All asset amounts are returned as `AssetAmount` objects which contain an `Asset` and `Amount` (`number`).
* All asset amount inputs are expected as micro units e.g. 1 Algo = 1_000_000 micro units.

## Signing & Submission

The SDk separates transaction preparation from signing and submission to leave the developer in full control of how transactions are signed and submitted to the network.

### Preparation
The `prepare_X_transactions` methods all return a `TransactionGroup` object. This is a container object containing an array of transaction objects (`.TRANSACTIONS`) and a list for signed transactions (`.SIGNED_TRANSACTIONS`). 

```typescript
prepare_app_optin_transactions(ACCOUNT:string)
```


### Signing
In most cases some of the transactions have a corresponding entry in `.signed_transactions` because they have been signed by the Pool LogicSig. The remaining transactions should be signed by the 'user'.

The `TransactionGroup` includes a method to do this when signing with a private key:

```typescript
sign_with_private_key(ACCOUNT_ADDRESS:string, ACCOUNT_PRIVATE_KEY:Uint8Array)
```

A User account LogicSig can also be used in a similar way or using the `sign_with_logicisg` convenience method:
```typescript
sign_with_logicisg(LOGICSIG:algosdk.LogicSigAccount)
```

### Submission

A `TransactionGroup` containing fully signed transactions can be submitted to the network in either of two ways:

Using an Algod client:

```typescript
const algod = new algosdk.Algodv2('','https://api.algoexplorer.io','',{'user-agent':'algo-sdk'});
const txid = algod.sendRawTransaction(transaction_group.signed_transactions)
```

Or, using the convenience method of the `TinymanClient`:

```typescript
const result = client.submit(transaction_group, true)
```

This method submits the signed transactions and optionally waits for confirmation.


# License

tinyman-py-sdk is licensed under a MIT license except for the exceptions listed below. See the LICENSE file for details.

## Exceptions
`src/asc.json` is covered by the license here: https://github.com/tinymanorg/tinyman-contracts-v1/blob/main/LICENSE
