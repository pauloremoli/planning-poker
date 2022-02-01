import {
    Resolver,
    Ctx,
    Arg,
    Field,
    Mutation,
    ObjectType,
    Query,
} from "type-graphql";
import { IdType, User, UserRole } from "../entities/User";
import { MyContext } from "../types";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { FieldError } from "./FieldError";
import { registerEnumType } from "type-graphql";

registerEnumType(UserRole, {
    name: "UserRole",
});

registerEnumType(IdType, {
    name: "IdType",
});

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

    @Query(() => [User], { nullable: true })
    async users(@Ctx() { em }: MyContext) {
        return await em.find(User, {});
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Arg("email") email: string,
        @Arg("phone") phone: string,
        @Arg("address") address: string,
        @Arg("city") city: string,
        @Arg("state") state: string,
        @Arg("zipCode") zipCode: string,
        @Arg("identification") identification: string,
        @Arg("idType", () => IdType) idType: IdType,
        @Arg("userRole", () => UserRole) userRole: UserRole,
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
            phone: phone,
            address: address,
            zipCode: zipCode,
            city: city,
            state: state,
            identification: identification,
            idType: idType,
            userRole: userRole,
        });
        try {
            await em.save(user);
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

    @Mutation(() => UserResponse)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { em, redis }: MyContext
    ) {
        const user = await em.findOne(User, { email });
        if (!user) {
            return {
                errors: [
                    {
                        field: "email",
                        message: "Email not found",
                    },
                ],
            };
        }
        const token = v4();
        console.log(token);

        redis.set(
            FORGET_PASSWORD_PREFIX + token,
            user.id,
            "ex",
            1000 * 60 * 60 * 24 * 3
        ); // 3 days
        const body = `Use this link to change password: <a href=\"http://localhost:3000/change-password/${token}"> Reset password</a>`;

        console.log(body);

        await sendEmail(email, body);
        return { user };
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { req, em, redis }: MyContext
    ): Promise<UserResponse> {
        const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);
        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "This ink is not valid anymore.",
                    },
                ],
            };
        }

        let user = await em.findOne(User, { id: parseInt(userId) })!;
        if (!user) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "User not found",
                    },
                ],
            };
        }

        if (newPassword.length < 3) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "Must have at least 3 characters",
                    },
                ],
            };
        }

        user.password = await argon2.hash(newPassword);
        em.save(user);

        await redis.del(FORGET_PASSWORD_PREFIX + token);

        req.session.userId = user.id;

        return { user };
    }
}
