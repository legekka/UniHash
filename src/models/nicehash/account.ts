export interface AccountResponse {
    total: AccountTotal,
    currencies: Currency[]
}

export interface AccountTotal {
    currency: string,
    totalBalance: number,
    available: number,
    pending: number
}

export interface Currency {
    active: boolean,
    currency: string,
    totalBalance: number,
    available: number,
    pending: number,
    btcRate?: number,
    fiatRate?: number,
    enabled?: boolean
}