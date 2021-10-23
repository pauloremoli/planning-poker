import React from "react";
import { Form, Formik } from "formik";
import {
    Flex,
    Box,
    Stack,
    Button,
    Heading,
    useColorModeValue,
} from "@chakra-ui/react";
import InputField from "../components/InputField";
import BoxWrapper from "../components/BoxWrapper";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

interface ForgotPasswordProps {}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({}) => {
    const router = useRouter();

    return (
        <>
            <Navbar />
            <BoxWrapper>
                <Formik
                    initialValues={{ email: "" }}
                    onSubmit={async (values, { setErrors }) => {
                        router.push("/");
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
                                            Create your account
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
                                                label="Email"
                                                name="email"
                                                placeholder="Email"
                                            />
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
                                                    Forgot password
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

export default ForgotPassword;
