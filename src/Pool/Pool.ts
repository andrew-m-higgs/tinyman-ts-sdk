import algosdk from "algosdk";
import AccountInformation from "algosdk/dist/types/src/client/v2/algod/accountInformation";
import AlgodClient from "algosdk/dist/types/src/client/v2/algod/algod";
import { Asset } from "../Asset/Asset.js";
import AssetAmount from "../Asset/AssetAmount.js";
import { TinymanMainnetClient, TinymanTestnetClient } from "../Client.js";
import { getPoolLogicSig } from "../contracts.js";
import { PREPARE_ASSET_OPTIN_TRANSACTIONS } from "../optin.js";
import { prepare_bootstrap_transactions } from "../Transactions/Bootstrap.js";
import { prepare_burn_transactions } from "../Transactions/Burn.js";
import { prepare_redeem_fees_transactions } from "../Transactions/Fees.js";
import { prepare_mint_transactions } from "../Transactions/Mint.js";
import { prepare_redeem_transactions } from "../Transactions/Redeem.js";
import { prepare_swap_transactions } from "../Transactions/Swap.js";
import { getStateInt } from "../Utils.js";
import BurnQuote from "./BurnQuote.js";
import MintQuote from "./MintQuote.js";
import SwapQuote from "./SwapQuote.js";

export class Pool{
    private client:TinymanMainnetClient;
    private asset1:Asset;
    private asset2:Asset;
    public exists = false;
    public liquidity_asset:CreatedAsset|null = null;
    public asset1_reserves:number|null = null;
    public asset2_reserves:number|null = null;
    public issued_liquidity:number|null = null;
    public unclaimed_protocol_fees:number|null = null;
    public outstanding_asset1_amount:number|null = null;
    public outstanding_asset2_amount:number|null = null;
    public last_refreshed_round:number|null = null;
    public outstanding_liquidity_asset_amount:number|null = null;
    public POOL_ADDRESS:string|null = null;
    public POOL_LOGICSIG:algosdk.LogicSigAccount|null = null;

    constructor(client:TinymanMainnetClient,asset_a:Asset,asset_b:Asset){
        this.client=client;
        if(asset_a.id > asset_b.id){
            this.asset1 = asset_a;
            this.asset2 = asset_b;
        }
        else{
            this.asset1 = asset_b;
            this.asset2 = asset_a;
        }
        this.getPoolInfo()
    }

    public async from_account_info(accountInfo:Record<string,any>){
        const ACCOUNT = accountInfo as IAccount;
        const VALIDATOR_APP_ID = ACCOUNT['apps-local-state'][0]['id'];
        const VALIDATOR_APP_STATE = Object.assign({}, ...ACCOUNT['apps-local-state'][0]['key-value'].map((o:GlobalState)=> ({[o.key]: o.value})));
        const ASSET1_ID = getStateInt(VALIDATOR_APP_STATE, 'a1')
        const ASSET2_ID = getStateInt(VALIDATOR_APP_STATE, 'a2')

        const pool_logicsig = getPoolLogicSig(VALIDATOR_APP_ID, ASSET1_ID, ASSET2_ID)
        const pool_address = pool_logicsig.address();

        if(pool_address===ACCOUNT.address){
            this.exists = true;
            this.asset1_reserves = getStateInt(VALIDATOR_APP_STATE, 's1')
            this.asset2_reserves = getStateInt(VALIDATOR_APP_STATE, 's2')
            this.issued_liquidity = getStateInt(VALIDATOR_APP_STATE, 'ilt')
            this.unclaimed_protocol_fees = getStateInt(VALIDATOR_APP_STATE, 'p')

            this.liquidity_asset = ACCOUNT['created-assets'][0]
            let liquidity_asset_id = this.liquidity_asset['index'];

            this.outstanding_asset1_amount = VALIDATOR_APP_STATE[Buffer.from('6f'+ASSET1_ID.toString(16).padStart(16,'0'),'hex').toString('base64')].uint as number;
            this.outstanding_asset2_amount = VALIDATOR_APP_STATE[Buffer.from('6f'+ASSET2_ID.toString(16).padStart(16,'0'),'hex').toString('base64')].uint as number;
            this.outstanding_liquidity_asset_amount = VALIDATOR_APP_STATE[Buffer.from('6f'+liquidity_asset_id.toString(16).padStart(16,'0'),'hex').toString('base64')].uint as number;

            const POOL:IPoolFromAccountInfo = {
                'address': pool_address,
                'asset1_id': ASSET1_ID,
                'asset2_id': ASSET2_ID,
                'liquidity_asset_id': liquidity_asset_id,
                'liquidity_asset_name': this.liquidity_asset['params']['name'],
                'asset1_reserves': this.asset1_reserves,
                'asset2_reserves': this.asset2_reserves,
                'issued_liquidity': this.issued_liquidity,
                'unclaimed_protocol_fees': this.unclaimed_protocol_fees,
                'outstanding_asset1_amount': this.outstanding_asset1_amount,
                'outstanding_asset2_amount': this.outstanding_asset2_amount,
                'outstanding_liquidity_asset_amount': this.outstanding_liquidity_asset_amount,
                'validator_app_id': VALIDATOR_APP_ID,
                'algo_balance': ACCOUNT['amount'],
                'round': ACCOUNT['round'],
            }
            return POOL
        }
        else{
            throw new Error(`Pool Address mismatch`);
        }
    }

    public async getPoolInfo(){
        try{
            this.POOL_LOGICSIG = getPoolLogicSig(this.client.VALIDATOR_APP_ID, this.asset1.id, this.asset2.id);
            this.POOL_ADDRESS = this.POOL_LOGICSIG.address()
            const ACCOUNT_INFO = await this.client.ALGOd.accountInformation(this.POOL_ADDRESS).do();
            return await this.from_account_info(ACCOUNT_INFO)
        }
        catch(e){
            throw e;
        }
    }

    public asset1_price(){
        if(this.asset1_reserves && this.asset2_reserves){
            return this.asset2_reserves/this.asset1_reserves;
        }
        else{
            throw new Error('Reserves are not available. Did you run getPoolInfo()?');
        }
    }
    public asset2_price(){
        if(this.asset1_reserves && this.asset2_reserves){
            return this.asset1_reserves/this.asset2_reserves;
        }
        else{
            throw new Error('Reserves are not available. Did you run getPoolInfo()?');
        }
    }
    public info(){
        const POOL = {
            'address': this.POOL_ADDRESS,
            'asset1_id': this.asset1.id,
            'asset2_id': this.asset2.id,
            'asset1_unit_name': this.asset1.unit_name,
            'asset2_unit_name': this.asset2.unit_name,
            'liquidity_asset_id': this.liquidity_asset?.index,
            'liquidity_asset_name': this.liquidity_asset?.params.name,
            'asset1_reserves': this.asset1_reserves,
            'asset2_reserves': this.asset2_reserves,
            'issued_liquidity': this.issued_liquidity,
            'unclaimed_protocol_fees': this.unclaimed_protocol_fees,
            'outstanding_asset1_amount': this.outstanding_asset1_amount,
            'outstanding_asset2_amount': this.outstanding_asset2_amount,
            'outstanding_liquidity_asset_amount': this.outstanding_liquidity_asset_amount,
            'last_refreshed_round': this.last_refreshed_round
        }
        return POOL
    }

    public async refresh(){
        return await this.getPoolInfo()
    }

    public convert(amount:AssetAmount){
        if(amount.Asset.id===this.asset1.id){
            return this.asset2.AssetAmount(Math.floor(amount.Amount*this.asset1_price()));
        }
        else if(amount.Asset.id===this.asset2.id){
            return this.asset1.AssetAmount(Math.floor(amount.Amount*this.asset2_price()));
        }
    }

    public async fetch_mint_quote(amount_a:AssetAmount,amount_b?:AssetAmount,slippage=0.05){
        let amount1 = (amount_a.Asset.id == this.asset1.id) ? amount_a : amount_b;
        let amount2 = (amount_a.Asset.id == this.asset2.id) ? amount_a : amount_b;
        let liquidity_asset_amount:number;
        await this.refresh();
        if(!this.exists){
            throw new Error('Pool has not been bootstrapped yet!');
        }
        if(this.issued_liquidity){
            if(!amount1 && amount2){
                amount1 = this.convert(amount2);
            }
            else if(!amount2 && amount1){
                amount2 = this.convert(amount1);
            }
            liquidity_asset_amount = Math.min(...[
                (amount1 as AssetAmount).Amount*this.issued_liquidity/(this.asset1_reserves as number),
                (amount2 as AssetAmount).Amount*this.issued_liquidity/(this.asset2_reserves as number)
            ])
        }
        else{ //First Mint
            if(!amount1 || !amount2){
                throw new Error('Amounts required for both assets for first mint!');
            }
            liquidity_asset_amount = Math.sqrt(amount1.Amount * amount2.Amount) - 1000
            //Don't apply slippage tolerance to first mint
            slippage = 0
        }

        const LiquidityAsset = new Asset(this.liquidity_asset?.index as number);
        await LiquidityAsset.fetch(this.client.ALGOd);
        const quote = new MintQuote(
            [amount1,amount2] as AssetAmount[],
            LiquidityAsset.AssetAmount(liquidity_asset_amount),
            slippage=slippage,
        )
        return quote;
    }

    public async fetch_burn_quote(liquidity_asset_in:number|AssetAmount,slippage=0.05){
        if (typeof liquidity_asset_in=='number'){
            const LiquidityAsset = new Asset(this.liquidity_asset?.index as number);
            await LiquidityAsset.fetch(this.client.ALGOd);
            liquidity_asset_in = LiquidityAsset.AssetAmount(liquidity_asset_in)
        }
        await this.refresh()
        let asset1_amount = (liquidity_asset_in.Amount * (this.asset1_reserves as number)) / (this.issued_liquidity as number)
        let asset2_amount = (liquidity_asset_in.Amount * (this.asset2_reserves as number)) / (this.issued_liquidity as number)

       let quote = new BurnQuote(
            [
                this.asset1.AssetAmount(asset1_amount),
                this.asset2.AssetAmount(asset2_amount)
            ],
            liquidity_asset_in,
            slippage,
        )
        return quote
    }

    public async fetch_fixed_input_swap_quote(amount_in:AssetAmount, slippage=0.05){
        let [asset_in, asset_in_amount] = [amount_in.Asset, amount_in.Amount];
        this.refresh();
        let asset_out:Asset,input_supply:number,output_supply:number;

        if (asset_in.id == this.asset1.id){
            asset_out = this.asset2
            input_supply = this.asset1_reserves as number;
            output_supply = this.asset2_reserves as number;
        }
        else{ 
            asset_out = this.asset1
            input_supply = this.asset2_reserves as number;
            output_supply = this.asset1_reserves as number;
        }

        if (!input_supply || !output_supply){
            throw new Error ('Pool has no liquidity!')
        }
        
        // k = input_supply * output_supply
        // ignoring fees, k must remain constant 
        // (input_supply + asset_in) * (output_supply - amount_out) = k
        const k = input_supply * output_supply
        const asset_in_amount_minus_fee = (asset_in_amount * 997) / 1000
        const swap_fees = asset_in_amount - asset_in_amount_minus_fee
        const asset_out_amount = output_supply - (k / (input_supply + asset_in_amount_minus_fee))

        const amount_out = asset_out.AssetAmount(Math.floor(asset_out_amount))

        const quote = new SwapQuote(
            'fixed-input',
            amount_in,
            amount_out,
            new AssetAmount(amount_in.Asset, Math.floor(swap_fees)),
            slippage,
        )
        return quote;
    }

    public async fetch_fixed_output_swap_quote(amount_out: AssetAmount, slippage=0.05){
        let [asset_out, asset_out_amount] = [amount_out.Asset, amount_out.Amount]
        await this.refresh();
        let asset_in:Asset,input_supply:number,output_supply:number;

        if (asset_out.id == this.asset1.id){
            asset_in = this.asset2
            input_supply = this.asset2_reserves as number;
            output_supply = this.asset1_reserves as number;
        }
        else{
            asset_in = this.asset1
            input_supply = this.asset1_reserves as number;
            output_supply = this.asset2_reserves as number;
        }
        // k = input_supply * output_supply
        //ignoring fees, k must remain constant 
        // (input_supply + asset_in) * (output_supply - amount_out) = k
        const k = input_supply * output_supply

        const calculated_amount_in_without_fee = (k / (output_supply - asset_out_amount)) - input_supply
        const asset_in_amount = calculated_amount_in_without_fee * 1000/997
        const swap_fees = asset_in_amount - calculated_amount_in_without_fee

        const amount_in = asset_in.AssetAmount(asset_in_amount);

        const quote = new SwapQuote(
            'fixed-output',
            amount_out,
            amount_in,
            new AssetAmount(amount_in.Asset, swap_fees),
            slippage,
        )

        return quote
    }

    public async prepare_swap_transactions(amount_in: AssetAmount, amount_out: AssetAmount, swap_type:SwapType, swapper_address?:string){
        swapper_address = swapper_address || this.client.USER_ADDRESS;
        const suggested_params = await this.client.ALGOd.getTransactionParams().do();
        const txn_group = prepare_swap_transactions(
            this.client.VALIDATOR_APP_ID,
            this.asset1.id,
            this.asset2.id,
            this.liquidity_asset?.index as number,
            amount_in.Asset.id,
            Math.floor(amount_in.Amount),
            Math.floor(amount_out.Amount),
            swap_type, 
            swapper_address as string,
            suggested_params,
        )
        return txn_group
    }

    public prepare_swap_transactions_from_quote(quote: SwapQuote, swapper_address?:string){
        return this.prepare_swap_transactions(
            quote.amount_in_with_slippage(),
            quote.amount_out_with_slippage(),
            quote.swap_type,
            swapper_address,
        )
    }

    public async prepare_bootstrap_transactions(pooler_address?:string){
        pooler_address = (pooler_address ?? this.client.USER_ADDRESS) as string;
        const suggested_params = await this.client.ALGOd.getTransactionParams().do();
        const txn_group = prepare_bootstrap_transactions(
            this.client.VALIDATOR_APP_ID,
            this.asset1.id,
            this.asset2.id,
            <string>this.asset1.unit_name,
            <string>this.asset2.unit_name,
            pooler_address,
            suggested_params,
        )
        return txn_group
    }

    private async prepare_mint_transactions(amounts_in: AssetAmount[], liquidity_asset_amount: number,liquidity_asset_id:number, pooler_address?:string){
        pooler_address = (pooler_address ?? this.client.USER_ADDRESS) as string;
        const asset1_amount = amounts_in[0].Amount;
        const asset2_amount = amounts_in[1].Amount;
        const suggested_params = await this.client.ALGOd.getTransactionParams().do();
        const txn_group = prepare_mint_transactions(
            this.client.VALIDATOR_APP_ID,
            this.asset1.id,
            this.asset2.id,
            liquidity_asset_amount,
            asset1_amount,
            asset2_amount,
            liquidity_asset_id,
            pooler_address,
            suggested_params,
        )
        return txn_group
    }

    public async prepare_mint_transactions_from_quote(quote: MintQuote, pooler_address?:string){
        return this.prepare_mint_transactions(
            [quote.amount1,quote.amount2],
            quote.liquidity_asset_amount_with_slippage(),
            quote.liquidity_asset_amount.Asset.id,
            pooler_address=pooler_address,
        )
    }

    private async prepare_burn_transactions(liquidity_asset_amount: AssetAmount, amounts_out:AssetAmount[], pooler_address?:string){
        pooler_address = pooler_address ?? this.client.USER_ADDRESS;
        const asset1_amount = amounts_out[0].Amount;
        const asset2_amount = amounts_out[1].Amount;
        const suggested_params = await this.client.ALGOd.getTransactionParams().do();
        const txn_group = prepare_burn_transactions(
            this.client.VALIDATOR_APP_ID,
            this.asset1.id,
            this.asset2.id,
            liquidity_asset_amount.Asset.id,
            asset1_amount,
            asset2_amount,
            liquidity_asset_amount.Amount,
            pooler_address as string,
            suggested_params,
        )
        return txn_group
    }

    public prepare_burn_transactions_from_quote(quote: BurnQuote, pooler_address?:string){
        return this.prepare_burn_transactions(
            quote.liquidity_asset_amount,
            quote.amounts_out_with_slippage(),
            pooler_address,
        )
    }

    public async prepare_redeem_transactions(amount_out: AssetAmount, user_address?:string){
        user_address = (user_address ?? this.client.USER_ADDRESS) as string
        const suggested_params = await this.client.ALGOd.getTransactionParams().do();
        const txn_group = prepare_redeem_transactions(
            this.client.VALIDATOR_APP_ID,
            this.asset1.id,
            this.asset2.id,
            this.liquidity_asset?.index as number,
            amount_out.Asset.id,
            amount_out.Amount,
            user_address,   
            suggested_params,
        )
        return txn_group
    }

    public async prepare_liquidity_asset_optin_transactions(user_address?:string){
        user_address = user_address ?? this.client.USER_ADDRESS;
        const suggested_params = await this.client.ALGOd.getTransactionParams().do();
        const txn_group = PREPARE_ASSET_OPTIN_TRANSACTIONS(this.liquidity_asset?.index as number,user_address as string,suggested_params);
        return txn_group;
    }

    public async prepare_redeem_fees_transactions(amount:number, creator:string, user_address?:string){
        user_address = user_address ?? this.client.USER_ADDRESS;
        const suggested_params = await this.client.ALGOd.getTransactionParams().do();
        const txn_group = prepare_redeem_fees_transactions(
            this.client.VALIDATOR_APP_ID,
            this.asset1.id,
            this.asset2.id,
            this.liquidity_asset?.index as number,
            amount,
            creator,
            user_address as string,
            suggested_params,
        )
        return txn_group
    }

    public get_minimum_balance(){
        const MIN_BALANCE_PER_ACCOUNT = 100000
        const MIN_BALANCE_PER_ASSET = 100000
        const MIN_BALANCE_PER_APP = 100000
        const MIN_BALANCE_PER_APP_BYTESLICE = 50000
        const MIN_BALANCE_PER_APP_UINT = 28500

        const num_assets = (this.asset2.id==0) ? 2 : 3
        const num_created_apps = 0
        const num_local_apps = 1
        const total_uints = 16
        const total_byteslices = 0

        const total = MIN_BALANCE_PER_ACCOUNT + 
        (MIN_BALANCE_PER_ASSET * num_assets) + 
        (MIN_BALANCE_PER_APP * (num_created_apps + num_local_apps)) + 
        (MIN_BALANCE_PER_APP_UINT * total_uints) + 
        (MIN_BALANCE_PER_APP_BYTESLICE * total_byteslices)
        return total
    }

    public async fetch_excess_amounts(user_address?:string){
        user_address = user_address ?? this.client.USER_ADDRESS;
        const pool_excess = (await this.client.fetch_excess_amounts(user_address))[this.POOL_ADDRESS as string];
        return pool_excess
    }
    
    public async fetch_pool_position(pooler_address?:string){
        pooler_address = pooler_address ?? this.client.USER_ADDRESS
        const account_info = (await this.client.ALGOd.accountInformation(pooler_address as string).do()) as IAccount;
        const assets = account_info.assets;
        const liquidity_asset = assets.filter(a=>a["asset-id"]==this.liquidity_asset?.index)[0];
        const liquidity_asset_amount = liquidity_asset.amount;
        const quote = await this.fetch_burn_quote(liquidity_asset_amount);
        const position = {
            [this.asset1.id]: quote.amounts_out[0],
            [this.asset2.id]: quote.amounts_out[1],
            [this.liquidity_asset?.index as number]: quote.liquidity_asset_amount,
            'share': (liquidity_asset_amount / <number>this.issued_liquidity),
        }
        return position;    
    }

    public async fetch_state(key?:string){
        const account_info = await this.client.ALGOd.accountInformation(this.POOL_ADDRESS as string).do();
        try{
            const validator_app_id = account_info['apps-local-state'][0]['id'];
            //reduce array to object
            const validator_app_state = account_info['apps-local-state'][0]['state'].reduce((acc:any,curr:any)=>{
                acc[curr['key']] = curr['value'];
                return acc;
            },{});

            if (key){
                return getStateInt(validator_app_state, key)
            }
            else{
                return validator_app_state
            }
        }
        catch(e){
            throw e;
        }
    }
}

interface IPoolFromAccountInfo{
    'address': string,
    'asset1_id': number,
    'asset2_id': number,
    'liquidity_asset_id': number,
    'liquidity_asset_name': string,
    'asset1_reserves': number,
    'asset2_reserves': number,
    'issued_liquidity':number,
    'unclaimed_protocol_fees': number
    'outstanding_asset1_amount': number,
    'outstanding_asset2_amount': number,
    'outstanding_liquidity_asset_amount': number,
    'validator_app_id': number,
    'algo_balance': number,
    'round': number,
}