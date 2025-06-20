import type { Server } from "node:http";
import type { GraphQLContext } from "@/server/types/context";
import { createResolvers, typeDefs } from "@/service";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { makeExecutableSchema } from "@graphql-tools/schema";
import depthLimit from "graphql-depth-limit";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import { GraphQLUpload } from "graphql-upload-ts";
import { createComplexityLimitRule } from "graphql-validation-complexity";
import type { Db } from "mongodb";
import type { WebSocketServer } from "ws";

export async function createApolloServer(httpServer: Server, wsServer: WebSocketServer, pubsub: RedisPubSub, db: Db) {
  const resolvers = createResolvers(db, pubsub);

  const allResolvers = {
    ...resolvers,
    Upload: GraphQLUpload,
  };

  const schema = makeExecutableSchema({
    typeDefs: ["scalar Upload", typeDefs],
    resolvers: allResolvers,
  });

  const validationRules = [
    depthLimit(5),
    createComplexityLimitRule(2000, {
      onCost: (cost) => console.log(`Query cost: ${cost}`),
    }),
  ];

  const server = new ApolloServer<GraphQLContext>({
    schema,
    introspection: true,
    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await new Promise<void>((resolve) => {
                wsServer.close(() => resolve());
              });
            },
          };
        },
      },
    ],
    csrfPrevention: {
      requestHeaders: ["content-type", "x-apollo-operation-name", "apollo-require-preflight"],
    },
    validationRules,
    formatError: (error) => {
      console.error(error);
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: {
          code: error.extensions?.code,
        },
      };
    },
  });

  await server.start();
  return server;
}
