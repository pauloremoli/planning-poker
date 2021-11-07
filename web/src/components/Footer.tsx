import {
    Facebook,
    Instagram,
    MailOutline,
    Phone,
    Room,
    WhatsApp,
} from "@material-ui/icons";
import React from "react";
import styled from "styled-components";
import NextLink from "next/link";

const Container = styled.div`
    height: 300px;
    padding: 20px;
    display: flex;
    background-color: #006262;
    color: white;
`;

const Left = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 30px;
`;

const Right = styled.div`
    flex: 1;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    margin-left: 50px;
`;

const Center = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const Logo = styled.span`
    font-weight: bold;
    font-size: 20px;
    color: white;
`;

const SocialMedia = styled.div`
    display: flex;
    margin-top: 30px;
`;

const SocialIcon = styled.div`
    color: white;
    background-color: #${(props) => props.color};
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
`;

const Title = styled.h3`
    margin-bottom: 30px;
    margin-top: 30px;
`;

const List = styled.ul`
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
`;

const ListItem = styled.li`
    width: 50%;
    margin-bottom: 10px;
    cursor: pointer;
`;

const ContactItem = styled.div`
    margin-bottom: 20px;
    display: flex;
    align-items: center;
`;

const Link = styled.a`
    text-decoration: none;
    color: white;
    cursor: pointer;
    &:hover {
        color: lightgray;
    }
    &:visited {
        color: white;
    }
`;

const Footer: React.FC<{}> = ({}) => {
    return (
        <>
            <Container>
                <Left>
                    <Logo>SONHO ENCANTADO</Logo>
                    <SocialMedia>
                        <SocialIcon color="3B5999">
                            <Link
                                target="_blank"
                                href="https://www.facebook.com/sonhoencantadopegueemonte/"
                            >
                                <Facebook />
                            </Link>
                        </SocialIcon>
                        <SocialIcon color="E4405F">
                            <Link
                                target="_blank"
                                href="https://www.instagram.com/sonhoencantado_pegueemonte/"
                            >
                                <Instagram />
                            </Link>
                        </SocialIcon>
                    </SocialMedia>
                </Left>
                <Center>
                    <Title>Links uteís</Title>
                    <List>
                        <ListItem>Home</ListItem>
                        <ListItem>Carrinho</ListItem>
                        <ListItem>Minha conta</ListItem>
                        <ListItem>Pedidos</ListItem>
                        <ListItem>Favoritos</ListItem>
                        <ListItem>Como funciona</ListItem>
                    </List>
                </Center>
                <Right>
                    <Title>Contato</Title>
                    <ContactItem>
                        <Room style={{ marginRight: "10px" }} />

                        <Link
                            target="_blank"
                            href="https://goo.gl/maps/haBMhkPbCGqGnSNJ9"
                        >
                            Rua Padre Guilherme Hopp, 128
                        </Link>
                    </ContactItem>
                    <ContactItem>
                        <Link
                            target="_blank"
                            href="https://api.whatsapp.com/send?phone=5512997032001"
                        >
                            <WhatsApp style={{ marginRight: "10px" }} /> (12)
                            99703-2001
                        </Link>
                    </ContactItem>
                </Right>
            </Container>
        </>
    );
};

export default Footer;
