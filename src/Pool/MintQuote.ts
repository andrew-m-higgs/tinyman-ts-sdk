import AssetAmount from "../Asset/AssetAmount.js";

export default class MintQuote{
    public amount1:AssetAmount;
    public amount2:AssetAmount;
    public liquidity_asset_amount:AssetAmount;
    public slippage:number;

    constructor(amounts:AssetAmount[],liquidity_asset_amount:AssetAmount,slippage:number){
        [this.amount1,this.amount2] = amounts;
        this.liquidity_asset_amount = liquidity_asset_amount;
        this.slippage = slippage;
    }

    public liquidity_asset_amount_with_slippage(){
        return this.liquidity_asset_amount.Amount - (this.liquidity_asset_amount.Amount * this.slippage)
    }
}