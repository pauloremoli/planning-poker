import React from "react";
import styled from "styled-components";
import { productsData } from "./data";
import Product from "./Product";

const Container = styled.div`
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
`;

const Header = styled.h1`
    padding: 20px;
`;

const RecentlyAdded: React.FC<{}> = () => {
    return (
        <>
            <Header>Novidades</Header>
            <Container>
                {productsData.slice(0, 5).map((item) => {
                    return <Product item={item} />;
                })}
            </Container>
        </>
    );
};

export default RecentlyAdded;
