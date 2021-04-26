import { Algorithm } from "../nicehash/algorithm.enum";
import { RigStatus } from "../nicehash/rig";
import { RigSnapshotDTO } from "./rig-snapshot-dto";

export interface RigDTO {
    id: number;
    rigId: string;
    name: string;
    snapshots: RigSnapshotDTO[];
}