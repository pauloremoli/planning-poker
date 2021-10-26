import "reflect-metadata";
import { __prod__, COOKIE_NAME } from "./constants";
import { MikroORM } from "@mikro-orm/core";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import morgan from "morgan";
import cors from "cors";

require("dotenv-safe").config();

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    const app = express();

    app.use(
        cors({
            credentials: true,
            origin: "http://localhost:3000",
            //origin: "https://studio.apollographql.com",
        })
    );

    app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

    let RedisStore = connectRedis(session);
    let redis = new Redis();

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ client: redis, disableTouch: true }),
            cookie: {
                maxAge: 315569520000, // 10 years
                httpOnly: true,
                secure: __prod__,
                sameSite: "lax",
            },
            saveUninitialized: true,
            secret: process.env.REDIS_SECRET!,
            resave: false,
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            em: orm.em,
            req: req,
            res: res,
            redis: redis
        }),
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: false,
    });

    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`App listening at http://localhost:${port}/graphql`);
    });
};

main().catch((err) => {
    console.error(err);
});