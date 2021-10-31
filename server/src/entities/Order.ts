import { MyContext } from './../types';
import { ProductDetails } from './ProductDetails';
import { Product } from "./Product";
import { Ctx, Field, Int, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToMany,
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

    @Field(() => [ProductDetails])
    @OneToMany(() => ProductDetails, pd => pd.order)
    productConnection: Promise<ProductDetails[]>;

    @Field(() => [Product])
    async products(@Ctx() { productsLoader }: MyContext): Promise<Product[]> {
        return productsLoader.load(this.id);
    }

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
