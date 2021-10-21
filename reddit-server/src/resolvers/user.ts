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

    @Mutation(() => UserResponse)
    async register(
        @Arg('user') userInput: UserInput,
        @Ctx() { em }: MyContext
    ): Promise<UserResponse> {
        if(userInput.username.length <= 2){
            return {
                errors: [{
                    field: "username",
                    message: "Username size must have at least 2 characters"
                }]
            };
        }

        if(userInput.password.length < 3){
            return {
                errors: [{
                    field: "password",
                    message: "Password size must have at least 3 characters"
                }]
            };
        }
        const hashedPassword = await argon2.hash(userInput.password);
        const user = em.create(User, { username: userInput.username, password: hashedPassword });
        try{
            await em.persistAndFlush(user);
        }catch(err){
            console.log(err);
            
            if(err.code === '23505'){
                return {
                    errors: [{
                        field: "username",
                        message: "Username already exists"
                    }]
                }
            }
            else{
                return {
                    errors: [{
                        field: "username",
                        message: err.detail
                    }]
                }
            }
        }
        return {user};
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