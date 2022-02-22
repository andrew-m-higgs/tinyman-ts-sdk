import algosdk, { assignGroupID, signTransaction, TransactionLike } from "algosdk";
import { writeFileSync } from "fs";

export function getStateInt(state:{[key:string]:StateValues}, key:string|number){
    if(typeof key==='string') key = Buffer.from(key).toString('base64');
    return state[key]['uint'] as number;
}
export function getProgram(definition:IPoolLogisticDef, variables:Record<string,number>){
    //Return a byte array to be used in LogicSig
    const template = definition['bytecode'];
    const sortedVariables = definition['variables'].sort((a,b)=>a['index']-b['index']);

    let template_bytes = [...new Uint8Array(Buffer.from(template,'base64'))];

    let offset = 0;

    for (const {name,type,index,length} of sortedVariables){
        const FORMATTED_NAME = name.split('TMPL_')[1].toLowerCase()
        const VALUE = variables[FORMATTED_NAME];
        const START = index - offset;
        const END = START + length;
        const VALUE_ENCODED = encode_value(VALUE,type);
        const VALUE_ENCODED_LENGTH = VALUE_ENCODED.byteLength;
        const DIFF = length - VALUE_ENCODED_LENGTH;
        offset += DIFF;
        template_bytes = template_bytes
        .slice(0, START)
        .concat(...VALUE_ENCODED)
        .concat(template_bytes.slice(END));
    }
    return new Uint8Array(template_bytes);
}

function encode_value(value:any, type:string){
    if (type == 'int') return encode_varint(value);
    throw new Error(`Unsupported value type ${type}!`)
}

function encode_varint(number:number) {
    let buf:Buffer[] = [];
    let offset = 0;
    while (true) {
        let towrite = number & 0x7f;
        number >>= 7;
        if (number>0) {
            buf.push(Buffer.from([towrite | 0x80]));
        } else {
            buf.push(Buffer.from([towrite]));
            break;
        }
    }
    return Buffer.concat(buf);
}

export class TransactionGroup{

    public TRANSACTIONS:algosdk.TransactionLike[];
    public SIGNED_TRANSACTIONS:(signedTX|null|TransactionLike)[]; //Need to write actual types for this.

    constructor(transactions:algosdk.TransactionLike[]){
        const GROUP = assignGroupID(transactions);
        this.TRANSACTIONS = GROUP;
        this.SIGNED_TRANSACTIONS = [...transactions].map(t=>null);
    }

    public sign_with_logic_sig(logicsig:algosdk.LogicSigAccount){
        const ADDRESS = logicsig.address();
        this.SIGNED_TRANSACTIONS = this.TRANSACTIONS.map((txn,i)=>{
            const FROM = algosdk.encodeAddress((this.TRANSACTIONS[i].from as algosdk.Address).publicKey);
            if(FROM==ADDRESS){
                let signedTX = algosdk.signLogicSigTransaction(txn,logicsig);
                return signedTX
            }
            return txn
        }) as signedTX[]
        return this;
    }

    public sign_with_private_key(address:string,privatekey:Uint8Array){
        console.log(this.SIGNED_TRANSACTIONS);
        this.SIGNED_TRANSACTIONS = this.SIGNED_TRANSACTIONS.map((txn,i)=>{
            console.log(this.TRANSACTIONS[i].from);
            const FROM = algosdk.encodeAddress((this.TRANSACTIONS[i].from as algosdk.Address).publicKey);
            if(FROM==address){
                let signedTX = algosdk.signTransaction((txn as algosdk.Transaction),privatekey);
                return signedTX;
            }
            else{
                return txn;
            }
        }) as signedTX[]
        return this;
    }

    public async submit(client:algosdk.Algodv2,wait=false){
        try{
            let txid = client.sendRawTransaction((this.SIGNED_TRANSACTIONS as signedTX[]).map(txn=>txn.blob)).do();
            if(wait){
                await txid;
            }
        }
        catch(e){
            throw e;
        }
    }

}

type signedTX = {
    txID: string;
    blob: Uint8Array;
}