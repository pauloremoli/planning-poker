import { User, UserRole } from "../entities/User";
import { EntityManager } from "typeorm";
import { Request } from "express";

export const isSameUser = async (
    em: EntityManager,
    req: Request,
    userId: number
) => {
    const user = await em.findOne(User, { id: req.session.userId });

    if (user?.userRole === UserRole.ADMIN || userId !== req.session.userId) {
        throw new Error("Access denied, content doesn't belong to this user");
    }
};
