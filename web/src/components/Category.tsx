import React from "react";
import styled from "styled-components";
import NextLink from "next/link";

const Container = styled.div`
    flex: 1;
    margin: 10px;
    padding: 10px;
    position: relative;
    transition: all 0.5s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: teal;
    cursor: pointer;
    &:hover {
        background-color: teal;
        color: white;
    }
`;

const Title = styled.h1`
    font-weight: 500;
    font-size: 20px;
    padding: 5px;
    border-radius: 20%;
    cursor: pointer;
    border-bottom: 2;
`;

type Item = {
    title: string;
    img: string;
    id: number;
};

interface CategoryProps {
    category: Item;
}

const Category: React.FC<CategoryProps> = ({ category: item }) => {
    return (
        <Container key={item.id}>
            <NextLink href={`/products/?category=${item.id}`}>
                <Title>{item.title.toLocaleUpperCase()}</Title>
            </NextLink>
        </Container>
    );
};

export default Category;
