import { RigSnapshotEntity } from "src/entities/rig-snapshot.entity";
import { RigDTO } from "../dto/rig-dto";
import { RigSnapshotDTO } from "../dto/rig-snapshot-dto";

export function CreateRigSnapshotDTO(rigSnapshot: RigSnapshotEntity): RigSnapshotDTO {
    return {
        id: rigSnapshot.id,
        timestamp: rigSnapshot.timestamp,
        currentUnpaidAmount: rigSnapshot.currentUnpaidAmount,
        totalUnpaidAmount: rigSnapshot.totalUnpaidAmount,
        statusTime: rigSnapshot.statusTime,
        minerStatus: rigSnapshot.minerStatus,
        profitability: rigSnapshot.profitability,
        temperature: rigSnapshot.temperature,
        powerUsage: rigSnapshot.powerUsage,
        revolutionsPerMinute: rigSnapshot.revolutionsPerMinute,
        revolutionsPerMinutePercentage: rigSnapshot.revolutionsPerMinutePercentage,
        speed: rigSnapshot.speed,
        displaySuffix: rigSnapshot.displaySuffix,
        algorithm: rigSnapshot.algorithm
    };
}

export function CreateRigDTOsFromSnapshots(rigSnapshots: RigSnapshotEntity[]): RigDTO[] {
    const rigs: RigDTO[] = [];
    rigSnapshots.forEach(rigSnapshot => {
        const snapshot = CreateRigSnapshotDTO(rigSnapshot);
        const rig = rigs.find(dto => dto.id === rigSnapshot.rig.id);
        if (rig == null) {
            rigs.push({
                id: rigSnapshot.rig.id,
                rigId: rigSnapshot.rig.rigId,
                name: rigSnapshot.rig.name,
                snapshots: [
                    snapshot
                ]
            });
        } else {
            rig.snapshots.push(snapshot);
        }
    });
    return rigs;
}