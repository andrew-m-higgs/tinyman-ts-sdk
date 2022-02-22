import algosdk, { makePaymentTxnWithSuggestedParams, PaymentTxn, SuggestedParams } from "algosdk";
import { getPoolLogicSig } from "../contracts.js";
import { TransactionGroup } from "../Utils.js";

export function prepare_redeem_fees_transactions(
    validator_app_id:number,
    asset1_id:number,
    asset2_id:number,
    liquidity_asset_id:number,
    amount:number,
    creator:string,
    sender:string,
    suggested_params:SuggestedParams){
    const LOGICSIG = getPoolLogicSig(validator_app_id,asset1_id,asset2_id);
    const POOL_ADDRESS = LOGICSIG.address();
    
    const TXNS = [
        algosdk.makePaymentTxnWithSuggestedParams(
            sender,
            POOL_ADDRESS,
            2000,
            undefined,
            new Uint8Array(Buffer.from('fee')),
            suggested_params
        ),
        algosdk.makeApplicationNoOpTxn(
            POOL_ADDRESS,
            suggested_params,
            validator_app_id,
            [
                new Uint8Array(Buffer.from('fees'))
            ],
            undefined,
            undefined,
            (asset2_id==0) ? [asset1_id,liquidity_asset_id] : [asset1_id,asset2_id,liquidity_asset_id]
        ),
        algosdk.makeAssetTransferTxnWithSuggestedParams(
            POOL_ADDRESS,
            sender,
            undefined,
            undefined,
            amount,
            undefined,
            liquidity_asset_id,
            suggested_params
        )
    ];
    
    const TXN_GROUP = new TransactionGroup(TXNS);
    TXN_GROUP.sign_with_logic_sig(LOGICSIG);

    return TXN_GROUP;
}