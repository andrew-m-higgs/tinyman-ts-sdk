import type { Asset } from "./Asset";

export default class AssetAmount{
    public Asset:Asset;
    public Amount:number;

    constructor(asset:Asset,amount:number){
        this.Asset = asset;
        this.Amount = amount;
    }
}