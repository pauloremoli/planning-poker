import React from "react";
import { Form, Formik } from "formik";
import {
    Flex,
    Box,
    Stack,
    Button,
    Heading,
    useColorModeValue,
    Checkbox,
    Link,
} from "@chakra-ui/react";
import NextLink from "next/link";
import InputField from "../components/InputField";
import BoxWrapper from "../components/BoxWrapper";
import { useLoginMutation, UserInput } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

interface LoginProps {}

const Login: React.FC<LoginProps> = ({}) => {
    const [LoginMutation] = useLoginMutation();
    const router = useRouter();

    return (
        <>
            <Navbar />
            <BoxWrapper>
                <Formik
                    initialValues={{ username: "", password: "" }}
                    onSubmit={async (values: UserInput, { setErrors }) => {
                        const response = await LoginMutation({
                            variables: { ...values },
                        });

                        if (response.data?.login.errors) {
                            setErrors(toErrorMap(response.data?.login.errors));
                        } else if (response.data?.login.user) {
                            router.push("/");
                        }

                        console.log(response.data);
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
                                            Log in to your account
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
                                                label="Username"
                                                name="username"
                                                placeholder="username"
                                            />
                                            <InputField
                                                label="Password"
                                                name="password"
                                                placeholder="password"
                                                type="password"
                                            />
                                            <Stack spacing={10}>
                                                <Stack
                                                    direction={{
                                                        base: "column",
                                                        sm: "row",
                                                    }}
                                                    align={"start"}
                                                    justify={"space-between"}
                                                >
                                                    <Checkbox>
                                                        Remember me
                                                    </Checkbox>
                                                    <NextLink href="forgot-password">
                                                        <Link
                                                            color={"blue.400"}
                                                        >
                                                            Forgot password?
                                                        </Link>
                                                    </NextLink>
                                                </Stack>
                                                <Button
                                                    bg={"blue.400"}
                                                    color={"white"}
                                                    _hover={{
                                                        bg: "blue.500",
                                                    }}
                                                    type="submit"
                                                    isLoading={isSubmitting}
                                                >
                                                    Login
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Flex>
                        </Form>
                    )}
                </Formik>
                );
            </BoxWrapper>
        </>
    );
};

export default Login;
