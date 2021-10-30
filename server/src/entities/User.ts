import { Field, Int, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm";

export enum UserRole {
    ADMIN = "admin",
    CLIENT = "client",
}

export enum IdType {
    RG = "rg",
    CPF = "cpf",
    PASSPORT = "passport",
}

// export const userSchema = Joi.object().keys({
//     username: Joi.string().alphanum().min(3).max(30).required(),
//     mail: Joi.string().email().required(),
//     password: Joi.string().min(6).required(),
//     phone: Joi.string().min(8).required(),
//     city: Joi.string().required(),
//     address: Joi.string().required(),
//     state: Joi.string().required(),
//     zipCode: Joi.string().required().pattern(new RegExp('/^[0-9]{8}$/')),
//     identification: Joi.string().required(),        
//     idType: Joi.string().required(),
// });

@ObjectType()
@Entity()
export class User extends BaseEntity {
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
    @Column({ unique: true })
    username!: string;

    @Field()
    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Field(() => String, { nullable: true })
    @Column({ nullable: true })
    avatar: string;

    @Field()
    @Column()
    phone!: string;

    @Field()
    @Column()
    address!: string;

    @Field()
    @Column()
    city!: string;

    @Field()
    @Column()
    zipCode!: string;

    @Field()
    @Column()
    state!: string;

    @Field()
    @Column()
    identification!: string;

    @Field()
    @Column({
        type: "enum",
        enum: IdType,
        default: IdType.CPF,
    })
    idType!: IdType;

    @Field()
    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.CLIENT,
    })
    userRole: UserRole;
}
