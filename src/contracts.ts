import algosdk from 'algosdk';
import { getProgram } from './Utils.js';

import { readFileSync } from 'fs';

const asc = JSON.parse(readFileSync('./src/asc.json').toString());
const _contracts = asc;

const pool_logicsig_def = _contracts['contracts']['pool_logicsig']['logic'];
const validator_app_def = _contracts['contracts']['validator_app'];

export function getPoolLogicSig(validator_app_id:number, asset1_id:number, asset2_id:number){
    try{
        const ASSETS = [asset1_id, asset2_id]
        const ASSETID1 = Math.max(...ASSETS)
        const ASSETID2= Math.min(...ASSETS);
        
        const PROGRAM_BYTES = getProgram(pool_logicsig_def, {
            validator_app_id:validator_app_id,
            asset_id_1:ASSETID1,
            asset_id_2:ASSETID2,
        });

        return new algosdk.LogicSigAccount(PROGRAM_BYTES);
    }
    catch(e){
        throw e;
    }
}