import { User, UserRole } from "../entities/User";
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
    // if (!context.req.session.userId) {
    //     throw new Error("Not authenticated");
    // }

    return next();
};

export const isAdmin: MiddlewareFn<MyContext> = async ({ /*context*/ }, next) => {
    // if (!context.req.session.userId) {
    //     throw new Error("Not authenticated");
    // }

    // const user = await context.em.findOne(User, {
    //     id: context.req.session.userId,
    // });
    // if (!user) {
    //     throw new Error(`Unkown user: id=${context.req.session.userId}`);
    // }

    // if (user.userRole !== UserRole.ADMIN) {
    //     throw new Error(
    //         `User is not an admin: id=${context.req.session.userId}`
    //     );
    // }

    return next();
};


