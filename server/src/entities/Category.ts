import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./Product";

@ObjectType()
@Entity()
export class Category extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({ unique: true })
    name!: string;

    @OneToMany(() => Product, product => product.category)
    @JoinColumn({ name: "categoryId" })
    products: Product[];
}
