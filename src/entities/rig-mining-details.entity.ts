import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'rigs' })
export class RigMiningDetails {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    rigId: string;

    @Column()
    name: string;

    @Column({ default: 0, type: "double precision" })
    currentUnpaidAmount: number;

    @Column({ default: 0, type: "double precision" })
    totalUnpaidAmount: number;

    @Column({ default: 0, type: "bigint"})
    uptimeDate: number;
}