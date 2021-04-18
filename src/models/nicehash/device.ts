import { PowerMode } from "./rig"
import { Speed } from "./speed"

export enum DeviceTypeEnumName {
    UNKNOWN = 'UNKNOWN',
    NVIDIA = 'NVIDIA',
    AMD = 'AMD',
    CPU = 'CPU'
}

export enum StatusEnumName {
    UNKNOWN = 'UNKNOWN',
    DISABLED = 'DISABLED',
    INACTIVE = 'INACTIVE',
    MINING = 'MINING',
    BENCHMARKING = 'BENCHMARKING',
    ERROR = 'ERROR',
    PENDING = 'PENDING',
    OFFLINE = 'OFFLINE'
}

export interface Status {
    enumName: StatusEnumName;
    description: string;
}

export enum DeviceIntensityEnumName {
    UNKNOWN = 'UNKNOWN',
    LOW = 'LOW',
    HIGH = 'HIGH'
}

export interface Device {
    id: string;
    name: string;
    deviceType: {
        enumName: DeviceTypeEnumName,
        description: string;
    };
    temperature: number;
    load: number;
    revolutionsPerMinute: number;
    revolutionsPerMinutePercentage: number
    powerMode: {
        enumName: PowerMode;
        description: string;
    };
    powerUsage: number;
    speeds: Speed[];
    intensity: {
        enumName: DeviceIntensityEnumName;
        description: string;
    };
    nhqm: string;
}