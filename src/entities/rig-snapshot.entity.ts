import { Algorithm } from "src/models/nicehash/algorithm.enum";
import { RigStatus } from "src/models/nicehash/rig";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RigEntity } from "./rig.entity";

@Entity({ name: 'rig_snapshots' })
export class RigSnapshotEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => RigEntity, rig => rig.id, { eager: true })
    rig: RigEntity;

    @Column({ type: "timestamptz" })
    timestamp: Date;

    @Column({ default: 0, type: "double precision" })
    currentUnpaidAmount: number;

    @Column({ default: 0, type: "double precision" })
    totalUnpaidAmount: number;

    @Column({ type: "enum", enum: RigStatus })
    minerStatus?: RigStatus;

    @Column({ type: "timestamptz" })
    statusTime: Date;

    @Column({ type: "float", nullable: true })
    speed?: number;

    @Column({ nullable: true })
    displaySuffix?: string;

    @Column({ nullable: true })
    revolutionsPerMinute?: number;

    @Column({ type: "float", nullable: true })
    revolutionsPerMinutePercentage?: number;

    @Column({ type: "enum", enum: Algorithm, nullable: true })
    algorithm: Algorithm;

    @Column({ nullable: true })
    temperature?: number;

    @Column({ type: "double precision", nullable: true })
    profitability?: number;

    @Column({ nullable: true })
    powerUsage?: number;

}



/*

RIG_SNAPSHOT
ID      RIG_ID      TIMESTAMP       PROF
1       1           345656657       0.0004
2       2           784564577       0.00036

*/