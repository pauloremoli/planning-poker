import "reflect-metadata";
import { __prod__, COOKIE_NAME } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import morgan from "morgan";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { createConnection } from "typeorm";
import { User } from "./entities/User";

require("dotenv-safe").config();

const main = async () => {
    const conn = await createConnection({
        type: 'postgres',
        database: 'sonhoencantado',
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        entities: [User],
    })
    const app = express();

    app.use(
        cors({
            credentials: true,
            origin: "http://localhost:3000",
            //origin: "https://studio.apollographql.com",
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
            resolvers: [UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            em: conn.createEntityManager(),
            req: req,
            res: res,
            redis: redis,
        }),
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: false,
    });

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log(`User Connected: ${socket.id}`);

        socket.on("join_room", (data) => {
            socket.join(data);
            console.log(`User with ID: ${socket.id} joined room: ${data}`);
        });

        socket.on("send_message", (data) => {
            socket.to(data.room).emit("receive_message", data);
        });

        socket.on("disconnect", () => {
            console.log("User Disconnected", socket.id);
        });
    });

    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`App listening at http://localhost:${port}/graphql`);
    });
};

main().catch((err) => {
    console.error(err);
});
