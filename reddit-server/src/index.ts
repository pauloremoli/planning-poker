import "reflect-metadata";
import { __prod__ } from "./constants";
import { MikroORM } from "@mikro-orm/core";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";

require("dotenv").config();

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();

    const app = express();

    let RedisStore = connectRedis(session);
    let redisClient = redis.createClient();

    app.use(
        session({
            name: "reddit",
            store: new RedisStore({ client: redisClient, disableTouch: true }),
            cookie: {
                maxAge: 315569520000, // 10 years
                httpOnly: true,
                secure: __prod__,
            },
            saveUninitialized: false,
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
        }),
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
    });

    const port = 3001;
    app.listen(port, () => {
        console.log(`App listening at http://localhost:${port}`);
    });
};

main().catch((err) => {
    console.error(err);
});
