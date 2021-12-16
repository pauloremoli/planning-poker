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

const Categories: React.FC<{}> = ({}) => {
    return (
        <>
            <Container>
                {categoriesData.map((item) => {
                    return <Category category={item} />;
                })}
            </Container>
        </>
    );
};

export default Categories;
