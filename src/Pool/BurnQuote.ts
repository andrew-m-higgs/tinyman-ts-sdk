import AssetAmount from "../Asset/AssetAmount.js";

export default class BurnQuote{
    public amounts_out:AssetAmount[];
    public liquidity_asset_amount:AssetAmount;
    public slippage:number;

    constructor(amounts_out:AssetAmount[],liquidity_asset_amount:AssetAmount,slippage:number){
        this.amounts_out = amounts_out;
        this.liquidity_asset_amount = liquidity_asset_amount;
        this.slippage = slippage;
    }

    public amounts_out_with_slippage(){
        let out:AssetAmount[] = [];
        for(const k of this.amounts_out){
            out.push(new AssetAmount(k.Asset,k.Amount - (k.Amount * this.slippage)))
        }
        return out
    }
}