import algosdk, { makePaymentTxnWithSuggestedParams, PaymentTxn, SuggestedParams } from "algosdk";
import AssetAmount from "../Asset/AssetAmount.js";
import { getPoolLogicSig } from "../contracts.js";
import { TransactionGroup } from "../Utils.js";

export function prepare_burn_transactions(
    validator_app_id:number,
    asset1_id:number,
    asset2_id:number,
    liquidity_asset_id:number,
    asset1_amount:number,
    asset2_amount:number,
    liquidity_asset_amount:number,
    sender:string,
    suggested_params:SuggestedParams){

    const LOGICSIG = getPoolLogicSig(validator_app_id,asset1_id,asset2_id);
    const POOL_ADDRESS = LOGICSIG.address();

    const TXNS = [
        algosdk.makePaymentTxnWithSuggestedParams(
            sender,
            POOL_ADDRESS,
            3000,
            undefined,
            new Uint8Array(Buffer.from('fee')),
            suggested_params
        ),
        algosdk.makeApplicationNoOpTxn(
            POOL_ADDRESS,
            suggested_params,
            validator_app_id,
            [new Uint8Array(Buffer.from('burn'))],
            [sender],
            undefined,
            (asset2_id==0) ? [asset1_id,liquidity_asset_id] : [asset1_id,asset2_id,liquidity_asset_id]
        ),
        algosdk.makeAssetTransferTxnWithSuggestedParams(
            POOL_ADDRESS,
            sender,
            undefined,
            undefined,
            asset1_amount,
            undefined,
            asset1_id,
            suggested_params
        ),
        (asset2_id!==0) ? algosdk.makeAssetTransferTxnWithSuggestedParams(
            POOL_ADDRESS,
            sender,
            undefined,
            undefined,
            asset2_amount,
            undefined,
            asset2_id,
            suggested_params
        ) : algosdk.makePaymentTxnWithSuggestedParams(
            POOL_ADDRESS,
            sender,
            asset2_amount,
            undefined,
            undefined,
            suggested_params
        ),
        algosdk.makeAssetTransferTxnWithSuggestedParams(
            sender,
            POOL_ADDRESS,
            undefined,
            undefined,
            liquidity_asset_amount,
            undefined,
            liquidity_asset_id,
            suggested_params
        ),

    ]
    
    const TXN_GROUP = new TransactionGroup(TXNS);
    TXN_GROUP.sign_with_logic_sig(LOGICSIG);

    return TXN_GROUP;
}