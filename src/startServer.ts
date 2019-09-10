import { User } from "./entity/User";
import { merge } from "lodash";
import { importSchema } from "graphql-import";
import { GraphQLServer } from "graphql-yoga";
import { createTypeormConn } from "./utils/createTypeormConn";
// import { port } from "./constants";
import * as path from "path";
import * as fs from "fs";
import { makeExecutableSchema } from "graphql-tools";
import * as Redis from "ioredis";

export async function startServer() {
  const resolvers_arr: {}[] = [];
  const typeDefs_arr: string[] = [];
  //["register", "tmp"]
  const folders = fs.readdirSync(path.join(__dirname, "./modules"));

  folders.forEach(folder => {
    //folder refers to real folder name
    const { resolvers } = require(`./modules/${folder}/resolvers`);
    const typeDefs = importSchema(
      path.join(__dirname, `./modules/${folder}/schema.graphql`)
    );

    resolvers_arr.push(resolvers);
    typeDefs_arr.push(typeDefs);
  });
  //make executable schema
  const resolvers = merge({}, ...resolvers_arr);
  let schema = makeExecutableSchema({ resolvers, typeDefs: typeDefs_arr });
  //redis
  let redis = new Redis();

  const server = new GraphQLServer({
    schema,
    context: ({ request }) => {
      return {
        redis,
        url: `${request.protocol}/${request.get("host")}`
      };
    }
  });

  const connection = await createTypeormConn();

  //用来接受confirm email的request.
  server.express.get("/confirm/:id", async (req, res) => {
    //update User
    const { id } = req.params;
    const userId = await redis.get(id);
    if (userId) {
      await connection
        .createQueryBuilder()
        .update(User)
        .set({ confirmed: true })
        .where("id = :id", { id: userId })
        .execute();
      redis.del(id);
      res.send("ok");
    } else {
      res.send("invalid");
    }
  });

  const app = await server.start({
    port: process.env.NODE_ENV === "test" ? 4001 : 4000
  });
  return { app, connection };
}
