import React from "react";
import styled from "styled-components";
import Products from "../../components/admin/products/Products";
import Sidebar from "../../components/admin/Sidebar";

const Layout = styled.div`
    display: flex;
    width: 100%;
`;

const Content = styled.div`
    display: flex;
    width: 100%;
    flex: 7;
`;

const DahsboardProducts = () => {
    return (
        <>
            <Layout>
                <Sidebar />
                <Content>
                    <Products />
                </Content>
            </Layout>
        </>
    );
};

export default DahsboardProducts;
