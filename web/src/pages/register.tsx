import React from 'react';
import { Form, Formik } from 'formik';
import {
    Flex,
    Box,
    Stack,
    Button,
    Heading,
    useColorModeValue,
} from '@chakra-ui/react';
import InputField from '../components/InputField';
import BoxWrapper from '../components/BoxWrapper';
import { gql, useMutation } from '@apollo/client';

interface RegisterProps { }

const REGISTER_MUTATION = gql`
    mutation Register($user: UserInput!) {
        register(user: $user) {
        errors {
            field
            message
        }
        user {
            id
            username
        }
        }
    }
`;

const Register: React.FC<RegisterProps> = ({ }) => {
    const [registerMutation, { data, loading, error }] = useMutation(REGISTER_MUTATION);
    return (
        <BoxWrapper>
            <Formik
                initialValues={{ username: "", password: "" }}
                onSubmit={(values) => {
                    return registerMutation({ user: values })
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Flex
                            minH={'100vh'}
                            align={'center'}
                            justify={'center'}
                            bg={useColorModeValue('gray.50', 'gray.800')}>
                            <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
                                <Stack align={'center'}>
                                    <Heading fontSize={'4xl'}>Create your account</Heading>
                                </Stack>
                                <Box
                                    rounded={'lg'}
                                    bg={useColorModeValue('white', 'gray.700')}
                                    boxShadow={'lg'}
                                    p={8}>
                                    <Stack spacing={4}>
                                        <InputField label="Username" name="username" placeholder="username" />
                                        <InputField label="Password" name="password" placeholder="password" type="password" />
                                        <Stack spacing={10}>
                                            <Button
                                                bg={'blue.400'}
                                                color={'white'}
                                                _hover={{
                                                    bg: 'blue.500',
                                                }} type="submit" isLoading={isSubmitting}>
                                                Register
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Flex>
                    </Form>

                )}
            </Formik>);
        </BoxWrapper>
    )
}

export default Register;