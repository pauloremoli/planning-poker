import {
    Resolver,
    Ctx,
    Arg,
    Field,
    Mutation,
    ObjectType,
    Query,
} from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "../types";
import argon2 from "argon2";
import {COOKIE_NAME} from '../constants'
import { sendEmail } from "../utils/sendEmail";

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    
    @Query(() => User, { nullable: true })
    async me(@Ctx() { req, em }: MyContext) {
        if (!req.session.userId) {
            return null;
        }

        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Arg("email") email: string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        if (username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Must have at least 2 characters",
                    },
                ],
            };
        }

        if (password.length < 3) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Must have at least 3 characters",
                    },
                ],
            };
        }
        const hashedPassword = await argon2.hash(password);
        const user = em.create(User, {
            username: username,
            password: hashedPassword,
            email: email,
        });
        try {
            await em.persistAndFlush(user);
        } catch (err) {
            console.log(err.details);

            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username already exists",
                        },
                    ],
                };
            } else {
                return {
                    errors: [
                        {
                            field: "username",
                            message: err.detail,
                        },
                    ],
                };
            }
        }

        //set cookie to keep user logged in
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        let user = await em.findOne(User, { username })!;

        console.log(req.session.userId);

        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Username doesn't exist",
                    },
                ],
            };
        }

        const valid = await argon2.verify(user!.password, password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Incorrect password",
                    },
                ],
            };
        }

        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        
        return new Promise((resolve) => {
            res.clearCookie(COOKIE_NAME);
            req.session.destroy((err) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }

                resolve(true);
            });
        });
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { em }: MyContext) {
            const user = await em.findOne(User, {email});
            if(!user){
                return false;
            }
        sendEmail(email, "Change password");
        return true;
    }
}

