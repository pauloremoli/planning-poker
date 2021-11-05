import React from "react";
import styled from "styled-components";
import CategoryItem from "./CategoryItem";
import { categoriesData } from "./data";

const Container = styled.div`
    display: flex;
    padding: 20px;
    justify-content: space-between;
`;


const Categories: React.FC<{}> = ({}) => {
    return (
        <>
            <Container>
                {categoriesData.map((item) => {
                    return <CategoryItem item={item} />;
                })}
            </Container>
        </>
    );
};

export default Categories;
