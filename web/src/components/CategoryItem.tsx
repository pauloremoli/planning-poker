import React from "react";
import styled from "styled-components";
import Image from "next/image";


const Container = styled.div`
    flex: 1;
    margin: 3px;
    height: 70vh;
    position: relative;
`;

const Info = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Title = styled.h1`
    color: white;
    margin-bottom: 20px;
`;

const Button = styled.button`
    border: none;
    padding: 10px;
    background-color: white;
    color: gray;
    cursor: pointer;
    font-weight: 600;
`;

type Item = {
    title: string;
    img: string;
    id: number;
};

interface CategoryItemProps {
    item: Item;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ item }) => {
    return (
        <Container key={item.id}>
            <Image
                src={item.img}
                width="100%"
                height="100%"
                layout="responsive"
                objectFit="cover"
            />
            <Info>
                <Title>{item.title}</Title>
                <Button>VER TEMAS</Button>
            </Info>
        </Container>
    );
};

export default CategoryItem;
