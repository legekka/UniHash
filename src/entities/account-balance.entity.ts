import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'account_balance' })
export class AccountBalanceEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "timestamptz" })
    timestamp: Date;

    @Column()
    currency: string;

    @Column({ type: "float" })
    totalBalance: number
}