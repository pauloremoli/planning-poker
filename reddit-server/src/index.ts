import "reflect-metadata";
import { __prod__ } from './constants';
import { MikroORM } from "@mikro-orm/core"
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { PostResolver } from './resolvers/post';

require('dotenv').config();

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver],
            validate: false,
        }),
        context: () => ({
            em: orm.em
        })
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
    });

    const port = 3001;
    app.listen(port, () => {
        console.log(`App listening at http://localhost:${port}`)
    })

}


main().catch(err => {
    console.error(err);
});