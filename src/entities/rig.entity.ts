import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'rigs' })
export class RigEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    rigId: string;

    @Column()
    name: string;

    @Column()
    active: boolean;
}