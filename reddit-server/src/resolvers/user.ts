import { Resolver, Ctx, Arg, InputType, Field, Mutation, ObjectType } from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from '../types';
import argon2 from "argon2";

@InputType()
class UserInput {
    @Field()
    username: string

    @Field()
    password: string
}

@ObjectType()
class FieldError {
    @Field()
    field: string
    @Field()
    message: string
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => User, { nullable: true })
    user?: User
}

@Resolver()
export class UserResolver {

    @Mutation(() => User)
    async register(
        @Arg('user') userInput: UserInput,
        @Ctx() { em }: MyContext
    ): Promise<User> {
        const hashedPassword = await argon2.hash(userInput.password);
        const user = em.create(User, { username: userInput.username, password: hashedPassword });
        await em.persistAndFlush(user);
        return user;
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('user') userInput: UserInput,
        @Ctx() { em }: MyContext
    ): Promise<UserResponse> {
        let user = await em.findOne(User, { username: userInput.username })!;
        if (!user) {
            return { 
                errors: [{
                field: "username",
                message: "Username doesn't exist"
            }]};
        }

        const valid = await argon2.verify(user!.password, userInput.password);
        if (!valid) {
            errors: [{
                field: "password",
                message: "Incorrect password"
            }];
        }

        return { user };
    }

}