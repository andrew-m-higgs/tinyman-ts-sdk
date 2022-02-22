import algosdk, { makePaymentTxnWithSuggestedParams, PaymentTxn, SuggestedParams } from "algosdk";
import { getPoolLogicSig } from "../contracts.js";
import { TransactionGroup } from "../Utils.js";

export function prepare_bootstrap_transactions(
    validator_app_id:number,
    asset1_id:number,
    asset2_id:number,
    asset1_unit_name:string,
    asset2_unit_name:string,
    sender:string,
    suggested_params:SuggestedParams){
    const LOGICSIG = getPoolLogicSig(validator_app_id,asset1_id,asset2_id);
    const POOL_ADDRESS = LOGICSIG.address();

   if(asset1_id<asset2_id) throw new Error('Asset 1 ID must be greater than Asset 2 ID');
   if(asset2_id==0) asset2_unit_name='ALGO';
    
    const TXNS = [
        algosdk.makePaymentTxnWithSuggestedParams(
            sender,
            POOL_ADDRESS,
            (asset2_id>0) ? 961000 : 860000,
            undefined,
            new Uint8Array(Buffer.from('fee')),
            suggested_params
        ),
        algosdk.makeApplicationOptInTxn(
            POOL_ADDRESS,
            suggested_params,
            validator_app_id,
            [
                new Uint8Array(Buffer.from('bootstrap')),
                new Uint8Array(Buffer.from([asset1_id])),
                new Uint8Array(Buffer.from([asset2_id]))
            ],
            undefined,
            undefined,
            (asset2_id==0) ? [asset1_id] : [asset1_id,asset2_id]
        ),
        algosdk.makeAssetCreateTxnWithSuggestedParams(
            POOL_ADDRESS,
            undefined,
            0xFFFFFFFFFFFFFFFFn,
            6,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            'TMPOOL11',
            `TinymanPool1.1 ${asset1_unit_name}-${asset2_unit_name}`,
            'https://tinyman.org',
            undefined,
            suggested_params
        ),
        algosdk.makeAssetTransferTxnWithSuggestedParams(
            POOL_ADDRESS,
            POOL_ADDRESS,
            undefined,
            undefined,
            0,
            undefined,
            asset1_id,
            suggested_params
        )
    ]
    if(asset2_id>0){
        TXNS.push(
            algosdk.makeAssetTransferTxnWithSuggestedParams(
                POOL_ADDRESS,
                POOL_ADDRESS,
                undefined,
                undefined,
                0,
                undefined,
                asset2_id,
                suggested_params
            )
        )
    }
    
    const TXN_GROUP = new TransactionGroup(TXNS);
    TXN_GROUP.sign_with_logic_sig(LOGICSIG);

    return TXN_GROUP;
}