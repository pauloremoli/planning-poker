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
    display: flex;
    flex-direction: column;
    justify-content: center;
    ${mobile({ width: "75%" })}
`;

const Title = styled.h1`
    font-size: 24px;
    font-weight: 300;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const Input = styled.input`
    flex: 1;
    width: 60%;
    margin: 20px 10px 0px 0px;
    padding: 10px;
`;

const Button = styled.button`
    width: 60%;
    border: none;
    padding: 15px 20px;
    background-color: teal;
    color: white;
    margin-top: 20px;
    justify-content: center;
    cursor: pointer;
`;

const Login: React.FC<{}> = () => {
    return (
        <>
            <Navbar />
            <Container>
                <Wrapper>
                    <Title>LOGIN</Title>
                    <Form>
                        <Input placeholder="Usuário" />
                        <Input placeholder="Senha" />
                        <Button>ENTRAR</Button>
                    </Form>
                </Wrapper>
            </Container>
        </>
        
  
        );
};

export default Login;
