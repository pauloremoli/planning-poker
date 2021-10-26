import React, { ReactNode } from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { useApolloClient } from "@apollo/client";
import {
    Box,
    Flex,
    Link,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    useDisclosure,
    useColorModeValue,
    Stack,
    useColorMode,
    Center,
    Text,
} from "@chakra-ui/react";
import CustomAvatar from "./CustomAvatar";

const NavLink = ({ children }: { children: ReactNode }) => (
    <Link
        px={2}
        py={1}
        rounded={"md"}
        _hover={{
            textDecoration: "none",
            bg: useColorModeValue("gray.200", "gray.700"),
        }}
        href={"#"}
    >
        {children}
    </Link>
);

export default function Navbar() {
    const [logout, { loading: logoutFetching }] = useLogoutMutation();
    const apolloClient = useApolloClient();

    const { data } = useMeQuery();

    let menuItems = null;

    if (data?.me) {
        console.log(data);

        menuItems = (
            <>
                <Flex alignItems={"center"}>
                    <Stack direction={"row"} spacing={7}>
                        <Menu>
                            <MenuButton
                                as={Button}
                                rounded={"full"}
                                variant={"link"}
                                cursor={"pointer"}
                                minW={0}
                            >
                                <CustomAvatar
                                    size="sm"
                                    url={data?.me?.avatar}
                                />
                            </MenuButton>
                            <MenuList alignItems={"center"}>
                                <br />
                                <Center>
                                    <CustomAvatar
                                        size="2xl"
                                        url={data?.me?.avatar}
                                    />
                                </Center>
                                <br />
                                <Center>
                                    <p>{data?.me?.username}</p>
                                </Center>
                                <br />
                                <MenuDivider />
                                <NextLink href="/profile">
                                <MenuItem>Edit profile</MenuItem>
                                </NextLink>
                                <NextLink href="/login">
                                    <MenuItem
                                        onClick={() => {
                                            logout();
                                            apolloClient.resetStore();
                                        }}
                                    >
                                        Log out
                                    </MenuItem>
                                </NextLink>
                            </MenuList>
                        </Menu>
                    </Stack>
                </Flex>
            </>
        );
    } else {
        menuItems = (
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
        <>
            <Box bg={useColorModeValue("gray.100", "gray.900")} px={4}>
                <Flex
                    h={16}
                    alignItems={"center"}
                    justifyContent={"space-between"}
                >
                    <Box>Logo</Box>
                    {menuItems}
                </Flex>
            </Box>
        </>
    );
}
