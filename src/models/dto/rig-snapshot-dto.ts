import { Algorithm } from "../nicehash/algorithm.enum";
import { RigStatus } from "../nicehash/rig";

export interface RigSnapshotDTO {
    id: number;
    timestamp: Date;
    currentUnpaidAmount: number;
    totalUnpaidAmount: number;
    currentUnpaidAmountPercent?: number;     // calculated from all rig's currentUnpaidAmount
    totalUnpaidAmountPercent?: number;       // calculated from all rig's totalUnpaidAmount
    algorithm?: Algorithm;                   // rigdetails.devices[1].speeds[0]
    speed?: number;                          // rigdetails.devices[1].speeds[0]
    displaySuffix?: string;                  // rigdetails.devices[1].speeds[0]
    temperature?: number;                    // rigdetails.devices[1]     
    powerUsage?: number;
    revolutionsPerMinute?: number;           // same
    revolutionsPerMinutePercentage?: number;
    profitability?: number;
    minerStatus?: RigStatus;
    statusTime?: Date;
}