import { Badge } from "@material-ui/core";
import {
    FavoriteBorder,
    FavoriteOutlined,
    Search,
    ShoppingCartOutlined,
} from "@material-ui/icons";
import NextLink from "next/link";
import React from "react";
import styled from "styled-components";

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
    cursor: pointer;
`;

const MenuItem = styled.div`
    font-size: 14px;
    cursor: pointer;
    margin-left: 25px;
    padding: 5px;
`;

const Link = styled.a`
    text-decoration: none;
    font-weight: bold;
`;

const Navbar: React.FC<{}> = ({}) => {
    return (
        <>
            <Container>
                <Wrapper>
                    <Left>
                        <SearchContainer>
                            <Input placeholder="Pesquisa por tema" />
                            <Search
                                style={{
                                    color: "gray",
                                    fontSize: 16,
                                    cursor: "pointer",
                                }}
                            />
                        </SearchContainer>
                    </Left>
                    <Center>
                        <NextLink href="/home">
                            <Logo>SONHO ENCANTADO</Logo>
                        </NextLink>
                    </Center>
                    <Right>
                        <MenuItem>
                            <NextLink href="/register">
                                <Link>CADASTRO</Link>
                            </NextLink>
                        </MenuItem>

                        <MenuItem>
                            <NextLink href="/login">
                                <Link >LOGIN</Link>
                                </NextLink>
                        </MenuItem>
                        <MenuItem>
                            <Badge badgeContent={1} color="primary">
                                <NextLink href="/cart">
                                    <FavoriteBorder />
                                </NextLink>
                            </Badge>
                        </MenuItem>
                        <MenuItem>
                            <Badge badgeContent={1} color="primary">
                                <NextLink href="/cart">
                                    <ShoppingCartOutlined />
                                </NextLink>
                            </Badge>
                        </MenuItem>
                    </Right>
                </Wrapper>
            </Container>
        </>
    );
};

export default Navbar;
