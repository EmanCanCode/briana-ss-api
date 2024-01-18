export interface IUser {
    _id?: any;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    password: string;
    phone: string;
    dob: string;
    address: string;
    privateKey: string;   
    balances: {
        [key: string]: ITokenBalance;  // key is the token address
    }
    lastSpacial: ISpacial;
    facial: IFacial;
}

export type LoginCredentials = Pick<IUser, 'username' | 'password'>;


export interface IBaseToken {
    name: string;
    symbol: string;
}

export interface ITokenBalance extends IBaseToken {
    balance: number;
}

export interface ISpacial {
    lat: string;
    lng: string;
    time: string;  // ISO string
}

// todo: facial auth
export interface IFacial {
    data: unknown;
}


export interface TxForm { 
    signedTx: string, 
    signature: string 
}

// sending tx
export interface SendTxForm {
    spacial: ISpacial;
    facial?: IFacial;
    txEncrypted: Buffer;
    _id: any;
}