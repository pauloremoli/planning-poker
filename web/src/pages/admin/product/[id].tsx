import React from "react";
import styled from "styled-components";
import ProductForm from "../../../components/admin/products/ProductForm";
import Sidebar from "../../../components/admin/Sidebar";

const Content = styled.div`
    display: flex;
`;

const DahsboardProducts = () => {
    return (
        <>
            <Content>
                <Sidebar />
                <ProductForm />
            </Content>
        </>
    );
};

export default DahsboardProducts;
