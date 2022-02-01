import GlobalStyle from "../styles/globals";
import client from "../utils/withApollo";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";

interface MyAppProps {
    Component: any;
    pageProps: any;
}

const MyApp: React.FC<MyAppProps> = ({ Component, pageProps }) => {
    const client = new ApolloClient({
        uri: "http://localhost:3001/graphql",
        cache: new InMemoryCache(),
        onError: ({ networkError, graphQLErrors }) => {
          console.log('graphQLErrors', graphQLErrors)
          console.log('networkError', networkError)
        }
    });

    return (
        <>
            <GlobalStyle />
            <ApolloProvider client={client}>
                <Component {...pageProps} />
            </ApolloProvider>
        </>
    );
};

export default MyApp;
