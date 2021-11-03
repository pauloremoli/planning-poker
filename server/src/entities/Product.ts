import { ProductDetails } from './ProductDetails';
import { Field, Int, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Category } from "./Category";

@ObjectType()
@Entity()
export class Product extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({ unique: true })
    name!: string;

    @Field()
    @Column({ unique: true })
    description!: string;

    @Field(() => Category)
    @ManyToOne(() => Category, category => category.products)
    category!: Category;

    @OneToMany(() => ProductDetails, pd => pd.order)
    orderConnection: Promise<ProductDetails[]>;

    @Field(() => [String!])
    @Column("simple-array")
    photos!: string[];

    @Field()
    @Column()
    price: number;

    @Field()
    @Column({ default: 1 })
    stock: number;

    @Field(() => String)
    @Column()
    createdAt: Date = new Date();

    @Field(() => String)
    @CreateDateColumn()
    updatedAt: Date;
}
