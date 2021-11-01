import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import morgan from "morgan";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Category } from "./entities/Category";
import { Order } from "./entities/Order";
import { Product } from "./entities/Product";
import { ProductDetails } from "./entities/ProductDetails";
import { User } from "./entities/User";
import { CategoryResolver } from "./resolvers/category";
import { OrderResolver } from "./resolvers/order";
import { ProductResolver } from "./resolvers/product";
import { UserResolver } from "./resolvers/user";
import { createProductsLoader } from "./utils/productsLoader";

require("dotenv-safe").config();

const main = async () => {
    const conn = await createConnection({
        type: "postgres",
        url: process.env.DATABASE_URL,
        logging: true,
        synchronize: true,
        entities: [User, Category, Product, Order, ProductDetails],
    });
    const app = express();

    app.use(
        cors({
            credentials: true,
            origin: [
                "http://localhost:3000",
                "https://studio.apollographql.com",
            ],
        })
    );

    app.use(
        morgan(":method :url :status :res[content-length] - :response-time ms")
    );

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
            resolvers: [
                UserResolver,
                CategoryResolver,
                ProductResolver,
                OrderResolver,
            ],
            validate: false,
        }),
        context: ({ req, res }) => ({
            em: conn.createEntityManager(),
            req: req,
            res: res,
            redis: redis,
            productsLoader: createProductsLoader(),
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
