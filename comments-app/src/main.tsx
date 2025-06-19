import { ApolloClient, ApolloProvider, InMemoryCache, split } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { createClient } from "graphql-ws";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { NotificationProvider } from "./context/NotificationContext";
import "./index.css";

const HTTP_URI = import.meta.env.VITE_API_URL;
const WS_URI = import.meta.env.VITE_WS_URL;

const wsLink = new GraphQLWsLink(
  createClient({
    url: WS_URI,
    connectionParams: () => {
      const token = localStorage.getItem("token");
      return {
        authorization: token ? `Bearer ${token}` : "",
      };
    },

    shouldRetry: () => true,
    retryAttempts: 5,
    retryWait: async (retries) => {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    },
  }),
);

const uploadLink = createUploadLink({
  uri: HTTP_URI,
  credentials: "include",
  headers: {
    "Apollo-Require-Preflight": "true",
  },
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "subscription";
  },
  wsLink,
  authLink.concat(uploadLink),
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Comment: {
        keyFields: ["id"],
        fields: {
          replies: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
      Query: {
        fields: {
          comments: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ApolloProvider>
  </StrictMode>,
);
