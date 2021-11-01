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

    @Field(() => Product)
    @ManyToOne(() => Product, (product) => product.orderConnection, {
        primary: true,
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "productId" })
    product: Promise<Product>;

    @Field(() => Order)
    @ManyToOne(() => Order, (order) => order.products, {
        primary: true,
        onDelete: "CASCADE"
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
