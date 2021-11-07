import React from "react";
import styled from "styled-components";
import Category from "./Category";
import { categoriesData } from "./data";

const Container = styled.div`
    display: flex;
    padding: 20px;
    justify-content: space-between;
    align-items: center;
`;

const Header = styled.h1`
    margin-top: 30px;
    padding: 20px;
`;

const Categories: React.FC<{}> = ({}) => {
    return (
        <>
            <Header>Categorias</Header>
            <Container>
                {categoriesData.map((item) => {
                    return <Category category={item} />;
                })}
            </Container>
        </>
    );
};

export default Categories;
