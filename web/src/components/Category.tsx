import React from "react";
import styled from "styled-components";

const Container = styled.div`
    flex: 1;
    margin: 10px;
    padding: 10px;
    height: 100px;
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
            <Title>{item.title.toLocaleUpperCase()}</Title>
        </Container>
    );
};

export default Category;
