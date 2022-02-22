import AssetAmount from "../Asset/AssetAmount.js";

export default class SwapQuote{
    public swap_type: SwapType;
    private amount_in: AssetAmount
    private amount_out: AssetAmount
    private swap_fees: AssetAmount
    private slippage: number

    constructor(swap_type:SwapType,amount_in:AssetAmount,amount_out:AssetAmount,swap_fees:AssetAmount,slippage:number){
        this.swap_type = swap_type;
        this.amount_in = amount_in;
        this.amount_out = amount_out;
        this.swap_fees = swap_fees;
        this.slippage = slippage;
    }

    public amount_out_with_slippage(){
        if (this.swap_type == 'fixed-output') return this.amount_out
        return new AssetAmount(this.amount_out.Asset,this.amount_out.Amount - (this.amount_out.Amount * this.slippage));
    }

    public amount_in_with_slippage(){
        if (this.swap_type == 'fixed-input') return this.amount_in
        return new AssetAmount(this.amount_in.Asset,this.amount_in.Amount + (this.amount_in.Amount * this.slippage));
    }

    public price(){
        return this.amount_out.Amount / this.amount_in.Amount
    }
    
    public price_with_slippage(){
        return this.amount_out_with_slippage().Amount / this.amount_in_with_slippage().Amount
    }

}