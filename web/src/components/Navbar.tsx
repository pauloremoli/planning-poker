import { Box, Button, Flex, Link, Stack, Text } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useColorModeValue } from "@chakra-ui/react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";

export default function Navbar() {
    const [logout, { loading: logoutFetching }] = useLogoutMutation();
    const { data } = useMeQuery();

    let body = null;

    if (data?.me) {
        console.log(data);

        body = (
            <>
                <Flex>
                    <Box>
                        <Text fontSize={"lg"} color={"white"} mr={2}>
                            {data?.me?.username}
                        </Text>
                    </Box>
                    <NextLink href="/login">
                        <Button
                            onClick={() => {
                                logout();
                            }}
                            isLoading={logoutFetching}
                            variant="link"
                            color={"white"}
                        >
                            Log out
                        </Button>
                    </NextLink>
                </Flex>
            </>
        );
    } else {
        body = (
            <>
                <Flex>
                    <NextLink href="/login">
                        <Link mr={2}>Log in</Link>
                    </NextLink>
                    <NextLink href="/register">
                        <Link>Sign up</Link>
                    </NextLink>
                </Flex>
            </>
        );
    }
    return (
        <Flex
            bg="blue"
            p={4}
            bg={useColorModeValue("blue.400", "gray.800")}
            color={useColorModeValue("white", "white")}
        >
            <Box ml={"auto"}>{body}</Box>
        </Flex>
    );
}
