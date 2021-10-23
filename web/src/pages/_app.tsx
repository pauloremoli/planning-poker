import { ChakraProvider, ColorModeProvider } from "@chakra-ui/react";

import theme from "../theme";
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    from,
    HttpLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

function MyApp({ Component, pageProps }) {
    const errorLink = onError(({ graphQLErrors }) => {
        if (graphQLErrors) {
            graphQLErrors.map(({ message }) => {
                alert(`Graphql error ${message}`);
            });
        }
    });

    const link = from([
        errorLink,
        new HttpLink({
            uri: "http://localhost:3001/graphql",
            credentials: "include",
        }),
    ]);

    const client = new ApolloClient({
        cache: new InMemoryCache(),
        link: link,
    });

    return (
        <ApolloProvider client={client}>
            <ChakraProvider resetCSS theme={theme}>
                <ColorModeProvider
                    options={{
                        useSystemColorMode: true,
                    }}
                >
                    <Component {...pageProps} />
                </ColorModeProvider>
            </ChakraProvider>
        </ApolloProvider>
    );
}

export default MyApp;
