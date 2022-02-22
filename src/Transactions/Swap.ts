import algosdk, { makePaymentTxnWithSuggestedParams, PaymentTxn, SuggestedParams } from "algosdk";
import { getPoolLogicSig } from "../contracts.js";
import { TransactionGroup } from "../Utils.js";

export function prepare_swap_transactions(validator_app_id:number,asset1_id:number,asset2_id:number,liquidity_asset_id:number,asset_in_id:number,asset_in_amount:number,asset_out_amount:number,swap_type:SwapType,sender:string,suggested_params:SuggestedParams){
    const LOGICSIG = getPoolLogicSig(validator_app_id,asset1_id,asset2_id);
    const POOL_ADDRESS = LOGICSIG.address();

    const SWAP_TYPES = {
        'fixed-input': 'fi',
        'fixed-output': 'fo',
    }

    const ASSET_OUT_ID = (asset_in_id == asset1_id) ? asset2_id : asset1_id;

    console.log(`Preparing ${swap_type} Swap for ${asset_in_amount} ${asset_in_id} to ${asset_out_amount} ${ASSET_OUT_ID}`);
    const FOREIGN_ASSETS:number[] = [liquidity_asset_id];
    
    if(ASSET_OUT_ID !== 0 ){
        FOREIGN_ASSETS.unshift(ASSET_OUT_ID)
    }
    if(asset_in_id !== 0 ){
        FOREIGN_ASSETS.unshift(asset_in_id)
    }
    
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
                new Uint8Array(Buffer.from('swap')),
                new Uint8Array(Buffer.from(SWAP_TYPES[swap_type]))
            ],
            [sender],
            undefined,
            FOREIGN_ASSETS.sort()
        ),
        (asset_in_id !==0) ? algosdk.makeAssetTransferTxnWithSuggestedParams(
            sender,
            POOL_ADDRESS,
            undefined,
            undefined,
            asset_in_amount,
            undefined,
            asset_in_id,
            suggested_params
        ) : makePaymentTxnWithSuggestedParams(sender,POOL_ADDRESS,asset_in_amount,undefined,undefined,suggested_params),
        (ASSET_OUT_ID !==0) ? algosdk.makeAssetTransferTxnWithSuggestedParams(
            POOL_ADDRESS,
            sender,
            undefined,
            undefined,
            asset_out_amount,
            undefined,
            ASSET_OUT_ID,
            suggested_params
        ) : makePaymentTxnWithSuggestedParams(POOL_ADDRESS,sender,asset_out_amount,undefined,undefined,suggested_params)
    ]
    const TXN_GROUP = new TransactionGroup(TXNS);
    console.log(JSON.stringify(TXN_GROUP,undefined,2));
    TXN_GROUP.sign_with_logic_sig(LOGICSIG);

    return TXN_GROUP;
}