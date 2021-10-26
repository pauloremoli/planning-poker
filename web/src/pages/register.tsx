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
import { useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

interface RegisterProps {}

const Register: React.FC<RegisterProps> = ({}) => {
    const [registerMutation] = useRegisterMutation();
    const router = useRouter();

    return (
        <>
            <Navbar />
            <BoxWrapper>
                <Formik
                    initialValues={{ username: "", password: "", email: "" }}
                    onSubmit={async (values, { setErrors }) => {
                        const response = await registerMutation({
                            variables: { ...values },
                        });

                        if (response.data?.register.errors) {
                            setErrors(
                                toErrorMap(response.data?.register.errors)
                            );
                        } else if (response.data?.register.user) {
                            router.push("/");
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
                                                label="Username"
                                                name="username"
                                                placeholder="username"
                                            />
                                            <InputField
                                                label="Email"
                                                name="email"
                                                placeholder="email"
                                            />
                                            <InputField
                                                label="Password"
                                                name="password"
                                                placeholder="password"
                                                type="password"
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
                                                    Register
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
    );
};

export default Register;
