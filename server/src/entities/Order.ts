import { Product } from "./Product";
import { Field, Int, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

export enum OrderStatus {
    PENDING = "pending",
    APPROVED = "approved",
    CANCELED = "canceled",
    RENTING = "renting",
    FINISHED = "finished",
}

@ObjectType()
@Entity()
export class Order extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @OneToOne(() => User)
    @JoinColumn()
    user!: User;

    @ManyToMany(() => Product)
    @JoinTable()
    products!: Product;

    @Field()
    @Column()
    rentalDate: Date;

    @Field()
    @Column()
    type: string;

    @Field()
    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Field()
    @Column()
    ammount: number;

    @Field(() => String)
    @Column()
    createdAt: Date = new Date();

    @Field(() => String)
    @CreateDateColumn()
    updatedAt: Date;
}
