import React from "react";
import styled from "styled-components";
import { FaProductHunt, FaPercentage } from "react-icons/fa";
import { BsCalendar3, BsCartCheck } from "react-icons/bs";
import { MdFeaturedVideo } from "react-icons/md";
import { BiUser, BiCategory } from "react-icons/bi";
import Link from "next/link";

const Logo = styled.span`
    font-weight: 700;
    font-size: 20px;
    cursor: pointer;
    margin-bottom: 20px;

    @media (max-width: 800px) {
        display: none;
    }
`;

const Content = styled.div`
    width: 200px;
    height: 100vh;
    background-color: #2f015a;
    color: #ffffffd6;
    display: flex;
    padding: 20px 20px;
    flex-direction: column;
    font-family: "Roboto", sans-serif;

    @media (max-width: 800px) {
        width: 50px;
        padding: 20px 5px;
    }
`;

const SidebarTop = styled.div`
    display: flex;
    border-bottom: 1px solid gray;
    border-top: 1px solid gray;
    padding: 20px 0px;

    @media (max-width: 800px) {
        border-top: 0px;
    }
`;

const SidebarBottom = styled.div`
    display: flex;
    padding: 10px 0px;
`;

const SidebarList = styled.ul`
    width: 100%;
`;

const SidebarItem = styled.li`
    text-decoration: none;
    list-style: none;
    padding: 10px;
    margin-bottom: 10px;
    display: flex;
    border-radius: 10px;
    align-items: center;
    background-color: ${(props) => (props.active ? "#543A6D" : "#2f015a")};
    color: ${(props) => (props.active ? "white" : "#ffffffd6")};

    &:hover {
        background-color: #543a6d;
        color: white;
        transform: scale(1.1);
        transition: 0.3s ease-out;
    }
`;

const SidebarItemText = styled.span`
    margin-left: 10px;
    font-weight: 600;
    @media (max-width: 800px) {
        display: none;
    }
`;

const LinkItem = styled.a`
    text-decoration: none;
    cursor: pointer;
    justify-content: center;
`;

const Sidebar: React.FC<{}> = ({}) => {
    return (
        <>
            <Content>
                <Logo>
                    <Link href="/admin/dashboard">
                        <LinkItem>Sonho Encantado</LinkItem>
                    </Link>
                </Logo>
                <SidebarTop>
                    <SidebarList>
                        <SidebarItem>
                            <FaProductHunt size={25} />
                            <Link href="/admin/products">
                                <LinkItem>
                                    <SidebarItemText>Produtos</SidebarItemText>
                                </LinkItem>
                            </Link>
                        </SidebarItem>

                        <SidebarItem>
                            <BsCartCheck size={25} />
                            <Link href="/admin/orders">
                                <LinkItem>
                                    <SidebarItemText>Pedidos</SidebarItemText>
                                </LinkItem>
                            </Link>
                        </SidebarItem>
                        <SidebarItem>
                            <BiCategory size={25} />
                            <Link href="/admin/categories">
                                <LinkItem>
                                    <SidebarItemText>
                                        Categorias
                                    </SidebarItemText>
                                </LinkItem>
                            </Link>
                        </SidebarItem>
                        <SidebarItem>
                            <BsCalendar3 size={25} />
                            <Link href="/admin/calendar">
                                <LinkItem>
                                    <SidebarItemText>
                                        Calendário
                                    </SidebarItemText>
                                </LinkItem>
                            </Link>
                        </SidebarItem>
                        <SidebarItem>
                            <MdFeaturedVideo size={25} />
                            <Link href="/admin/featured">
                                <LinkItem>
                                    <SidebarItemText>Destaques</SidebarItemText>
                                </LinkItem>
                            </Link>
                        </SidebarItem>
                        <SidebarItem>
                            <BiUser size={25} />
                            <Link href="/admin/users">
                                <LinkItem>
                                    <SidebarItemText>Usuários</SidebarItemText>
                                </LinkItem>
                            </Link>
                        </SidebarItem>
                        <SidebarItem>
                            <FaPercentage size={25} />
                            <Link href="/admin/sales">
                                <LinkItem>
                                    <SidebarItemText>Promoções</SidebarItemText>
                                </LinkItem>
                            </Link>
                        </SidebarItem>
                    </SidebarList>
                </SidebarTop>
                <SidebarBottom></SidebarBottom>
            </Content>
        </>
    );
};

export default Sidebar;
