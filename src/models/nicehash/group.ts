import { PowerMode, Rig, RigNotification } from "./rig";

export type Groups = { [groupName: string]: Group }

export enum GroupNotification {
    ALL = 'ALL',
    PARTIAL = 'PARTIAL'
}

export interface Group {
    rigs: Rig[];
    totalRigs?: number;
    miningRigs?: number;
    groupPowerMode?: PowerMode;
    notifications?: GroupNotification[];
}