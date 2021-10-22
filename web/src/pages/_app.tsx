import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react'

import theme from '../theme'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql
} from "@apollo/client";

function MyApp({ Component, pageProps }) {

  const client = new ApolloClient({
    uri: 'https://localhost:3001/graphql',
    cache: new InMemoryCache(),
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
  )
}

export default MyApp
