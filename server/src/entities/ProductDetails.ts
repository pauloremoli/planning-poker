import { Field, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

@ObjectType()
@Entity()
export class ProductDetails extends BaseEntity {
    @PrimaryColumn()
    productId: number;

    @PrimaryColumn()
    orderId: number;

    @ManyToOne(() => Product, (product) => product.orderConnection, {
        primary: true,
    })
    @JoinColumn({ name: "productId" })
    product: Promise<Product>;

    @ManyToOne(() => Order, (order) => order.productConnection, {
        primary: true,
    })
    @JoinColumn({ name: "orderId" })
    order: Promise<Order>;

    @Field()
    @Column()
    size!: string;

    @Field(() => String)
    @Column()
    createdAt: Date = new Date();

    @Field(() => String)
    @CreateDateColumn()
    updatedAt: Date;
}
