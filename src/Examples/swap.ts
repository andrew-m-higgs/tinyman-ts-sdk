import algosdk from "algosdk";
import { Asset,TinymanMainnetClient } from "./../index.js";

const MNEMONIC = '<YOUR MNEMONIC HERE>';
const ACCOUNT = algosdk.mnemonicToSecretKey(MNEMONIC);
const WALLET_ADDRESS = ACCOUNT.addr;
const SECRET_KEY = ACCOUNT.sk;

const client = new algosdk.Algodv2('','https://api.algoexplorer.io','',{'user-agent':'algo-sdk'});

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
    WALLET_ADDRESS);

//Sign the Transactions
TXNS.sign_with_private_key(WALLET_ADDRESS,SECRET_KEY);

//Submit the transactions and wait for confirmation
await TXNS.submit(client,true);