import styled from "styled-components";
import Navbar from "../components/Navbar";
import { mobile } from "../utils/responsive";

const Container = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Wrapper = styled.div`
    width: 40%;
    padding: 20px;
    background-color: white;
    ${mobile({ width: "75%" })}
`;

const Title = styled.h1`
    font-size: 24px;
    font-weight: 300;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
`;

const Input = styled.input`
    flex: 1;
    width: 60%;
    margin: 20px 10px 0px 0px;
    padding: 10px;
`;

const Button = styled.button`
    width: 40%;
    border: none;
    padding: 15px 20px;
    background-color: teal;
    color: white;
    margin-top: 20px;
    cursor: pointer;
`;

const Register: React.FC<{}> = () => {
    return (
        <>
            <Navbar />
            <Container>
                <Wrapper>
                    <Title>CADASTRO</Title>
                    <Form>
                        <Input placeholder="Nome" />
                        <Input placeholder="Sobrenome" />
                        <Input placeholder="Usuário" />
                        <Input placeholder="Email" />
                        <Input placeholder="Senha" />
                        <Input placeholder="Confirmação de senha" />
                        <Button>CADASTRAR</Button>
                    </Form>
                </Wrapper>
            </Container>
        </>
        
  
        );
};

export default Register;
