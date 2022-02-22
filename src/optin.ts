import algosdk, { Algodv2 } from "algosdk";
import { TransactionGroup } from "./Utils.js";

export function PREPARE_APP_OPTIN_TRANSACTIONS(validator_app_id:number,sender:string,params:algosdk.SuggestedParams){
    let txn = algosdk.makeApplicationOptInTxn(sender,params,validator_app_id);
    let txn_group = new TransactionGroup([txn])
    return txn_group
}

export function PREPARE_ASSET_OPTIN_TRANSACTIONS(asset_id:number,sender:string,params:algosdk.SuggestedParams){
    let txn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender,sender,undefined,undefined,0,undefined,asset_id,params);
    let txn_group = new TransactionGroup([txn])
    return txn_group
}