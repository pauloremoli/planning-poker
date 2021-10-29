import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Entity()
export class User extends BaseEntity{
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)
    @Column()
    createdAt: Date = new Date();

    @Field(() => String)
    @CreateDateColumn()
    updatedAt: Date;

    @Field()
    @Column({unique: true })
    username!: string;

    @Field()
    @Column({ unique: true })
    email!: string;

    @Column({ type: "text" })
    password!: string;

    @Field(() => String, { nullable: true })
    @Column({ nullable: true })
    avatar: string;
}
