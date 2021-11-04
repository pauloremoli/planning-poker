import React from "react";
import styled from "styled-components";
import { Search, ShoppingCartOutlined } from "@material-ui/icons";
import { Badge } from "@material-ui/core";

const Container = styled.div`
    height: 60px;
`;

const Wrapper = styled.div`
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Left = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
`;

const Right = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const Center = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Language = styled.span`
    font-size: 14px;
    cursor: pointer;
`;

const SearchContainer = styled.div`
    border: 0.5px solid lightgray;
    display: flex;
    align-items: center;
    margin-left: 25px;
    padding: 5px;
`;

const Input = styled.input`
    border: none;
`;

const Logo = styled.span`
    font-weight: bold;
    font-size: 20px;
`;

const MenuItem = styled.div`
    font-size: 14px;
    cursor: pointer;
    margin-left: 25px;
    padding: 5px;
`;

const Navbar: React.FC<{}> = ({}) => {
    return (
        <>
            <Container>
                <Wrapper>
                    <Left>
                        <SearchContainer>
                            <Input placeholder="Pesquisa por tema"/>
                            <Search style={{ color: "gray", fontSize: 16, cursor: "pointer"}} />
                        </SearchContainer>
                    </Left>
                    <Center>
                        <Logo>SONHO ENCANTADO</Logo>
                    </Center>
                    <Right>
                        <MenuItem>CADASTRO</MenuItem>

                        <MenuItem>ENTRAR</MenuItem>
                        <MenuItem>
                            <Badge badgeContent={4} color="primary">
                                <ShoppingCartOutlined />
                            </Badge>
                        </MenuItem>
                    </Right>
                </Wrapper>
            </Container>
        </>
    );
};

export default Navbar;
