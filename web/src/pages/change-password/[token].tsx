import React, { useState } from 'react'
import { NextPage } from 'next';

import { Form, Formik } from "formik";
import {
    Flex,
    Box,
    Stack,
    Button,
    Heading,
    useColorModeValue,
    Text
} from "@chakra-ui/react";
import NextLink from "next/link";
import InputField from "../components/InputField";
import BoxWrapper from "../components/BoxWrapper";
import { useChangePasswordMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

const ChangePassword: NextPage<{ token: string }> = ({ token }) => {

    const [ChangePasswordMutation] = useChangePasswordMutation();
    const router = useRouter();
    const [tokenError, setTokenError] = useState("")


    return (
        <>
            <Navbar />
            <BoxWrapper>
                <Formik
                    initialValues={{ password: "" }}
                    onSubmit={async (values, { setErrors }) => {
                        const response = await ChangePasswordMutation({
                            variables: { token, ...values },
                        });

                        if (response.data?.changePassword.errors) {
                            const errorMap = toErrorMap(response.data?.login.errors)
                            setErrors(errorMap);
                            if ('token' in errorMap) {
                                setTokenError(errorMap.token);
                            }
                        } else if (response.data?.login.user) {
                            router.push("/login");
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <Flex
                                minH={"100vh"}
                                align={"center"}
                                justify={"center"}
                                bg={useColorModeValue("gray.50", "gray.800")}
                            >
                                <Stack
                                    spacing={8}
                                    mx={"auto"}
                                    maxW={"lg"}
                                    py={12}
                                    px={6}
                                >
                                    <Stack align={"center"}>
                                        <Heading fontSize={"4xl"}>
                                            Change password
                                        </Heading>
                                    </Stack>
                                    <Box
                                        rounded={"lg"}
                                        bg={useColorModeValue(
                                            "white",
                                            "gray.700"
                                        )}
                                        boxShadow={"lg"}
                                        p={8}
                                    >
                                        <Stack spacing={4}>
                                            <InputField
                                                label="New password"
                                                name="password"
                                                placeholder="password"
                                                type="password"
                                            />
                                            {tokenError ? <Box><Text color="red">{tokenError}</Text></Box> : null}
                                            <Stack spacing={10}>

                                                <Button
                                                    bg={"blue.400"}
                                                    color={"white"}
                                                    _hover={{
                                                        bg: "blue.500",
                                                    }}
                                                    type="submit"
                                                    isLoading={isSubmitting}
                                                >
                                                    Ok
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Flex>
                        </Form>
                    )}
                </Formik>
            </BoxWrapper>
        </>
    )
}

ChangePassword.getInitialProps = ({ query }) => {
    return { token: query.token as string };
}

export default ChangePassword;