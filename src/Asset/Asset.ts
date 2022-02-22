import type { Algodv2 } from "algosdk";
import AssetAmount from "./AssetAmount.js";

export class Asset{
    public id:number;
    public name:string|undefined;
    public unit_name:string|undefined;
    public decimals:number|undefined;

    constructor(id:number){
        this.id = id;
        if(id==0){
            this.name='Algorand';
            this['unit_name'] = 'ALGO';
            this.decimals = 6;
        }
    }

    public async fetch(algod:Algodv2){
        if(this.id!==0){
            let asset = await algod.getAssetByID(this.id).do() as IFetchedAsset;
            this.name = asset.params.name;
            this.unit_name = asset.params["unit-name"];
            this.decimals = asset.params.decimals;
            return this
        }
        else{
            return this
        }
    }

    public AssetAmount(amount:number){
        return new AssetAmount(this,amount);
    }
}

export interface IFetchedAsset {
    index:number,
    params:{
        creator:string,
        decimals:number,
        'default-frozen':boolean,
        manager:string,
        name:string,
        reserve:string,
        total:number,
        'unit-name':string
    }
}