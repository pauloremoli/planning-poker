import "reflect-metadata";
import { __prod__ } from "./constants";
import { MikroORM } from "@mikro-orm/core";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import winston from "winston";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import morgan from "morgan";
import cors from "cors";

require("dotenv-safe").config();

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);

    const app = express();
    app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

    app.use(morgan("dev"));
    const logger = winston.createLogger({
        level: "info",
        format: winston.format.json(),
        defaultMeta: { service: "user-service" },
        transports: [
            //
            // - Write all logs with level `error` and below to `error.log`
            // - Write all logs with level `info` and below to `combined.log`
            //
            new winston.transports.File({
                filename: "error.log",
                level: "error",
            }),
            new winston.transports.File({ filename: "combined.log" }),
        ],
    });

    //
    // If we're not in production then log to the `console` with the format:
    // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
    //
    if (__prod__) {
        logger.add(
            new winston.transports.Console({
                format: winston.format.simple(),
            })
        );
    }

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
        cors: false
    });

    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`App listening at http://localhost:${port}/graphql`);
    });
};

main().catch((err) => {
    console.error(err);
});
