import { Algorithm } from './algorithm.enum';

export interface Stat {
    statsTime: number; // Last information fetch timestamp in milliseconds since 1.1.1970
    market: 'EU' | 'USA' | 'EU_N' | 'USA_E';
    algorithm : {
        enumName: Algorithm;
        description: string; // Translated description
    };
    unpaidAmount: number; // Unpaid amount
    difficulty: number; // Current rig difficulty
    proxyId: number; // Id of proxy where rig is connected
    timeConnected: number; // Connection timestamp in milliseconds since 1.1.1970
    xnsub: boolean; // Rig uses xn subscription
    speedAccepted: number; // Accepted speed
    speedRejectedR1Target: number; // Rejected speed - share above target
    speedRejectedR2Stale: number; // Rejected speed - stale shares
    speedRejectedR3Duplicate: number; // Rejected speed - duplicate jobs
    speedRejectedR4NTime: number; // Rejected speed - incorrect ntime
    speedRejectedR5Other: number; // Rejected speed - other reasons
    speedRejectedTotal: number; // Rejected speed - total
    profitability: number; // Rig profitability
}