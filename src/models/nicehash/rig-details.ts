import { Device } from "./device";
import { RigNotification, RigStatus } from "./rig";
import { Stat } from "./stat";

export enum RigType {
    MANAGED = 'MANAGED',
    UNMANAGED = 'UNMANAGED'
}

export interface RigDetails {
    rigId: string;
    type: RigType; // - Rig type - MANAGED, UNMANAGED
    name: string; // - Worker Name (optional)
    statusTime: number; //- The timestamp (EPOCH millis) of this status
    joinTime: number; //- The timestamp (EPOCH millis) of RIG joining
    minerStatus: RigStatus; // - Miner status (passed directly from NHM) - BENCHMARKING, MINING, STOPPED, OFFLINE, ERROR, PENDING, DISABLED, TRANSFERRED, UNKNOWN
    groupName: string; // - Group name
    unpaidAmount: number; // - Mining rig unpaid amount
    notifications: RigNotification[];
    softwareVersions: string; // - Software versions used on rig. E.g.: NHM3_WIN/3.0.0.5,EXCAVATOR/1.5.13a,XMR-STAK/2.5.1
    devices: Device[];
    cpuMiningEnabled: boolean;
    cpuExists: boolean;
    stats: Stat[];
    profitability: number; // - Rig profitability
    localProfitability: number; // - Rig local profitability
    rigPowerMode: string; // - Devices power mode - UNKNOWN, LOW, MEDIUM, HIGH, MIXED
}