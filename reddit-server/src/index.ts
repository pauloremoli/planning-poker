import { __prod__ } from './constants';
import {MikroORM} from "@mikro-orm/core"
import { Post } from './entities/Post';
import mikroConfig  from './mikro-orm.config';


require('dotenv').config();

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    //await orm.getMigrator().up();
    const post = orm.em.create(Post, {title: "My first post"});
    await orm.em.persistAndFlush(post);

    const posts = await orm.em.find(Post, {});
    console.log(posts);
    
}


main().catch(err => {
    console.error(err);
});