export enum RigStatus {
    BENCHMARKING = 'BENCHMARKING',
    MINING = 'MINING',
    STOPPED = 'STOPPED',
    OFFLINE = 'OFFLINE',
    ERROR = 'ERROR',
    PENDING = 'PENDING',
    DISABLED = 'DISABLED',
    TRANSFERRED = 'TRANSFERRED',
    UNKNOWN = 'UNKNOWN'
}

export enum PowerMode {
    UNKNOWN = 'UNKNOWN',
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    MIXED = 'MIXED'
}

export enum RigNotification {
    UNKNOWN = 'UNKNOWN',
    RIG_OFFLINE = 'RIG_OFFLINE',
    RIG_ERROR = 'RIG_ERROR',
    UNRECOGNIZED = 'UNRECOGNIZED'
}

export interface Rig {
    rigId: string;
    name: string;
    status: RigStatus;
    powerMode: PowerMode;
    notifications: RigNotification[];
    totalDevices: number;
    activeDevices: number;
}