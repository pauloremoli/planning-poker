import { Field, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { ProductDetails } from './ProductDetails';
import { User } from "./User";

@ObjectType()
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
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => User)
    @OneToOne(() => User)
    @JoinColumn()
    user!: User;

    @Field(() => [ProductDetails])
    @OneToMany(() => ProductDetails, pd => pd.order)
    products: Promise<ProductDetails[]>;

    @Field()
    @Column()
    rentalDate: Date;

    @Field()
    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Field()
    @Column()
    amount: number;

    @Field(() => String)
    @Column()
    createdAt: Date = new Date();

    @Field(() => String)
    @CreateDateColumn()
    updatedAt: Date;
}
