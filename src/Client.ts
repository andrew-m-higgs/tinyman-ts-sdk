import algosdk from 'algosdk';
import { Asset } from './Asset/Asset.js';
import { MAINNET_VALIDATOR_APP_ID, TESTNET_VALIDATOR_APP_ID } from './consts.js';
import { PREPARE_APP_OPTIN_TRANSACTIONS, PREPARE_ASSET_OPTIN_TRANSACTIONS } from './optin.js';
import { Pool } from './Pool/Pool.js';

class Client{

    public ALGOd:algosdk.Algodv2;
    public VALIDATOR_APP_ID:number;
    public USER_ADDRESS:string|undefined;
    private ASSETS_CACHE:Record<number,any> = {}

    constructor(ALGOd:algosdk.Algodv2,VALIDATOR_APP_ID:number,user_address?:string){
        this.ALGOd=ALGOd;
        this.VALIDATOR_APP_ID=VALIDATOR_APP_ID;
        this.USER_ADDRESS=user_address
    }

    public async fetch_pool(asset1:Asset,asset2:Asset,fetch:boolean=true){
        const pool:Pool = new Pool(this,asset1,asset2);
        await pool.getPoolInfo();
        return pool;
    }

    public async fetch_asset(id:number){
        if(!Object.keys(this.ASSETS_CACHE).includes(id.toString())){
            let asset = new Asset(id);
            await asset.fetch(this.ALGOd);
            this.ASSETS_CACHE[id] = asset;
        }
        return this.ASSETS_CACHE[id] as Asset;

    }

    public async submit(transaction_group:Uint8Array[],wait:boolean=false){
        let tx = this.ALGOd.sendRawTransaction(transaction_group).do();
        if(wait){
            await tx;
            return tx;
        }
        
    }

    public async prepare_app_optin_transactions(user_address:string|undefined){
        let address = user_address ?? this.USER_ADDRESS as string;
        let params = await this.ALGOd.getTransactionParams().do();
        let txn_group = PREPARE_APP_OPTIN_TRANSACTIONS(this.VALIDATOR_APP_ID,address,params);
        return txn_group;
    }

    public async prepare_asset_optin_transactions(asset_id:number,user_address:string|undefined){
        let address = user_address ?? this.USER_ADDRESS as string;
        let params = await this.ALGOd.getTransactionParams().do();
        let txn_group = PREPARE_ASSET_OPTIN_TRANSACTIONS(asset_id,address,params);
        return txn_group;
    }

    public async fetch_excess_amounts(user_address?:string){
        const ADDRESS = user_address ?? this.USER_ADDRESS as string;
        const ACCOUNT_INFO = (await this.ALGOd.accountInformation(ADDRESS).do() as IAccount);
        let validator = this.VALIDATOR_APP_ID;
        try{
            let decoder = new TextDecoder('utf8',{'ignoreBOM':true});
            const validator_app = ACCOUNT_INFO["apps-local-state"].filter(function(a) { return a.id == validator })[0];
            var validator_app_state = validator_app["key-value"].reduce(function(acc:Record<string,any>, cur) {
                acc[cur.key] = cur.value;
                return acc;
            }, {});
            var pools:Record<string,Record<string,any>> = {};
            for (var key in validator_app_state) {
                let decodedKey = Buffer.from(key,'base64');
                let decisiveByte = +decodedKey[decodedKey.length-9].toString(16);
                if(decisiveByte == +Number(Buffer.from('e')[0]).toString(16)){
                    let value = validator_app_state[key]['uint']
                    let pool_address = algosdk.encodeAddress(decodedKey.slice(0,decodedKey.length-9));
                    let asset_id = parseInt(decodedKey.slice(decodedKey.length-8,decodedKey.length).toString('hex'),16);
                    let asset = await this.fetch_asset(asset_id)
                    if(!Object.keys(pools).includes(key)){pools[pool_address]={}}
                    pools[pool_address][asset_id] = asset.AssetAmount(value);
                }
            }
            return pools;
        }
        catch(e:any){
            console.error(`Cannot fetch excess amounts`);
            throw new Error(e)
        }
    }  
    public async is_opted_in(user_address?:string){
        const ADDRESS = user_address ?? this.USER_ADDRESS as string;
        const ACCOUNT_INFO = (await this.ALGOd.accountInformation(ADDRESS).do() as IAccount);
        return ACCOUNT_INFO['apps-local-state'].map(s=>s.id).includes(this.VALIDATOR_APP_ID);
    }

    public async asset_is_opted_in(asset_id:number,user_address?:string){
        const ADDRESS = user_address ?? this.USER_ADDRESS as string;
        const ACCOUNT_INFO = (await this.ALGOd.accountInformation(ADDRESS).do() as IAccount);
        return ACCOUNT_INFO.assets.map(a=>a['asset-id']).includes(asset_id);
    }
}

class TinymanTestnetClient extends Client{
    constructor(algod:algosdk.Algodv2,user_address?:string){
        super(algod,TESTNET_VALIDATOR_APP_ID,user_address);
    }
}

class TinymanMainnetClient extends Client{
    constructor(algod:algosdk.Algodv2,user_address?:string){
        super(algod,MAINNET_VALIDATOR_APP_ID,user_address);
    }
}

export {TinymanMainnetClient,TinymanTestnetClient}