import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, of, zip } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators'
import { Groups } from 'src/models/nicehash/group';
import { v4 as uuidv4 } from 'uuid';
import * as Crypto from 'crypto';
import { RigDetails } from 'src/models/nicehash/rig-details';

@Injectable()
export class NicehashService {

    private readonly baseUrl: string = 'https://api2.nicehash.com'

    private apiKey: string;
    private apiSecret: string;
    private organizationId: string;

    constructor(
        private http: HttpService,
        private configService: ConfigService
    ) {
        this.apiKey = configService.get<string>('NICEHASH_API_KEY');
        this.apiSecret = configService.get<string>('NICEHASH_API_SECRET');
        this.organizationId = configService.get<string>('NICEHASH_ORG_ID');
    }

    getRigGroups(): Observable<Groups> {
        const path = '/main/api/v2/mining/groups/list';
        const url = this.baseUrl + path;
        return this.http.get<Groups>(url, { headers: this.getHeaders('GET', path) }).pipe(
            map(response => response.data)
        );
    }

    getRigDetails(rigId: string): Observable<RigDetails> {
        const path = `/main/api/v2/mining/rig2/${rigId}`;
        const url = this.baseUrl + path;
        return this.http.get<RigDetails>(url, {headers: this.getHeaders('GET', path)}).pipe(
            map(response => response.data)
        );
    }

    // Private helpers

    private getHeaders(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, query: string = ""): any {
        let xNonce = uuidv4();
        let xTime = Date.now();
        let xRequestId = uuidv4();
        let xAuth = this.getXAuth(method, path, xTime, xNonce, query)
        return {
            'X-Time': xTime,
            'X-Nonce': xNonce,
            'X-Request-Id': xRequestId,
            'X-Organization-Id': this.organizationId,
            'X-Auth': xAuth,
        }
    }

    private getXAuth(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, xTime: number, xNonce: string, query: string) {
        let inputArray: number[] = [
            ...Array.from(Buffer.from(this.apiKey)), 0x00,
            ...Array.from(Buffer.from(xTime.toString())), 0x00,
            ...Array.from(Buffer.from(xNonce)), 0x00, 0x00,
            ...Array.from(Buffer.from(this.organizationId)), 0x00, 0x00,
            ...Array.from(Buffer.from(method)), 0x00,
            ...Array.from(Buffer.from(path)), 0x00,
            ...Array.from(Buffer.from(query))
        ]
        let hash = Crypto.createHmac("sha256", this.apiSecret).update(Buffer.from(inputArray).toString()).digest("hex");
        return this.apiKey + ":" + hash;
    }
}
