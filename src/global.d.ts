type SwapType = "fixed-input"|"fixed-output";

interface Schema {
    'num-uint': number;
    'num-byte-slice': number;
}

interface Value {
    type: number;
    bytes: string;
    uint: number;
}

interface KeyValue {
    key: string;
    value: Value;
}

interface AppsLocalState {
    id: number;
    deleted: boolean;
    'opted-in-at-round': number;
    'closed-out-at-round': number;
    schema: Schema;
    'key-value': KeyValue[];
}

interface AppsTotalSchema {
    'num-uint': number;
    'num-byte-slice': number;
}

interface IAsset {
    amount: number;
    'asset-id': number;
    creator: string;
    'is-frozen': boolean;
    deleted: boolean;
    'opted-in-at-round': number;
    'opted-out-at-round': number;
}

interface LocalStateSchema {
    'num-uint': number;
    'num-byte-slice': number;
}

interface GlobalStateSchema {
    'num-uint': number;
    'num-byte-slice': number;
}

interface StateValues {
    type: number;
    bytes: string;
    uint: number;
}

interface GlobalState {
    key: string;
    value: StateValues;
}

interface CreatedAppParams {
    creator: string;
    'approval-program': string;
    'clear-state-program': string;
    'local-state-schema': LocalStateSchema;
    'global-state-schema': GlobalStateSchema;
    'global-state': GlobalState[];
    'extra-program-pages': number;
}

interface CreatedApp {
    id: number;
    deleted: boolean;
    'created-at-round': number;
    'deleted-at-round': number;
    params: CreatedAppParams;
}

interface CreatedAssetParams {
    clawback: string;
    creator: string;
    decimals: number;
    'default-frozen': boolean;
    freeze: string;
    manager: string;
    'metadata-hash': string;
    name: string;
    'name-b64': string;
    reserve: string;
    total: number;
    'unit-name': string;
    'unit-name-b64': string;
    url: string;
    'url-b64': string;
}

interface CreatedAsset {
    index: number;
    deleted: boolean;
    'created-at-round': number;
    'destroyed-at-round': number;
    params: CreatedAssetParams;
}

interface Participation {
    'selection-participation-key': string;
    'vote-first-valid': number;
    'vote-key-dilution': number;
    'vote-last-valid': number;
    'vote-participation-key': string;
}

interface IAccount {
    address: string;
    amount: number;
    'amount-without-pending-rewards': number;
    'apps-local-state': AppsLocalState[];
    'apps-total-schema': AppsTotalSchema;
    'apps-total-extra-pages': number;
    assets: IAsset[];
    'created-apps': CreatedApp[];
    'created-assets': CreatedAsset[];
    participation: Participation;
    'pending-rewards': number;
    'reward-base': number;
    rewards: number;
    round: number;
    status: string;
    'sig-type': string;
    'auth-addr': string;
    deleted: boolean;
    'created-at-round': number;
    'closed-at-round': number;
}

interface IPoolLogisticDef{
    bytecode: string;
    address: string;
    size: number;
    variables: {
        name: string;
        type: string;
        index: number;
        length: number;
    }[];
    source: string;
}