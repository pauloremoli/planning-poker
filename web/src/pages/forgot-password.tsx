import React, { useState } from "react";
import { Form, Formik } from "formik";
import {
    Flex,
    Box,
    Stack,
    Button,
    Heading,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import InputField from "../components/InputField";
import BoxWrapper from "../components/BoxWrapper";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { useForgotPasswordMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";

interface ForgotPasswordProps {}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({}) => {
    const router = useRouter();
    const [complete, setComplete] = useState(false);
    const [ForgotPasswordMutation] = useForgotPasswordMutation();

    return (
        <>
            <Navbar />
            <BoxWrapper>
                <Formik
                    initialValues={{ email: "" }}
                    onSubmit={async (values, { setErrors }) => {
                        const response = await ForgotPasswordMutation({
                            variables: { ...values },
                        });
                        if (response.data?.forgotPassword.errors) {
                            setErrors(
                                toErrorMap(response.data?.forgotPassword.errors)
                            );
                        } else if (response.data?.forgotPassword.user) {
                            setComplete(true);
                        }
                    }}
                >
                    {({ isSubmitting }) =>
                        complete ? (
                            <Box>
                                <Stack align={"center"}>
                                    <Heading fontSize={"4xl"}>
                                        Email sent
                                    </Heading>
                                    <Text>Check your email box.</Text>
                                </Stack>
                            </Box>
                        ) : (
                            <Form>
                                <Flex
                                    minH={"100vh"}
                                    align={"center"}
                                    justify={"center"}
                                    bg={useColorModeValue(
                                        "gray.50",
                                        "gray.800"
                                    )}
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
                                                Forgot password
                                            </Heading>
                                            <Text>
                                                You will receive an email with
                                                link to change the password
                                            </Text>
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
                        )
                    }
                </Formik>
            </BoxWrapper>
        </>
    );
};

export default ForgotPassword;
