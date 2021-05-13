import { HttpService, Injectable } from '@nestjs/common';
import { Observable, of, ReplaySubject, timer } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';

@Injectable()
export class CoinbaseService {

    private priceSource: ReplaySubject<PriceData> = new ReplaySubject(1);

    private currentPrice: PriceData;

    constructor(
        private http: HttpService,
    ) {
        this.initExchange()
    }

    initExchange() {
        // every 45 seconds
        timer(0, 1000 * 45).pipe(
            mergeMap(() => this.getBtcEurPrice()),
            map(priceResponseData => this.convertPriceData(priceResponseData)),
            tap(priceData => this.currentPrice = priceData),
            tap(priceData => this.priceSource.next(priceData))
        ).subscribe();
    }

    public getCurrentPrice(): PriceData {
        return this.currentPrice;
    }

    public getPriceSource(): Observable<PriceData> {
        return this.priceSource.asObservable();
    }

    private getBtcEurPrice(): Observable<PriceResponseData> {
        const url = "https://api.coinbase.com/v2/prices/BTC-EUR/spot";
        return this.http.get<PriceResponseData>(url).pipe(
            map(response => response.data)
        );
    }

    private convertPriceData(priceResponseData: PriceResponseData): PriceData {
        let priceData: PriceData = {
            value: parseFloat(priceResponseData.data.amount),
            currency: priceResponseData.data.currency
        }
        return priceData;
    }
}

export interface PriceResponseData {
    data: {
        amount: string,
        currency: string
    }
}

export interface PriceData {
    value: number,
    currency: string
}