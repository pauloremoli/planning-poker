import { Request, Response } from "express";
import { Session } from "express-session";
import { Redis } from "ioredis";
import { EntityManager } from "typeorm";
import { createProductsLoader } from "./utils/productsLoader";

declare module "express-session" {
    export interface SessionData {
        userId: number;
    }
}

export type MyContext = {
    em: EntityManager
    req: Request & { session: Session };
    res: Response;
    redis: Redis;
    productsLoader: ReturnType<typeof createProductsLoader>;
};
