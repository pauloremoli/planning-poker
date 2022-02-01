import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useProductsQuery, Product } from "../../../generated/graphql";
import ProductsTable from "./ProductsTable";
import Table from "../Table";
import Modal from "./ProductForm";
import { useRouter } from "next/router";

const Container = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    justify-content: flex-start;
    padding: 20px;
`;

const Title = styled.h1`
    font-size: 25px;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const Button = styled.button`
    padding: 10px 30px;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.5s ease;
    background-color: #2f015a;
    color: white;
    border-radius: 10px;
    margin-top: 50px;

    &:hover {
        background-color: #543a6d;
    }
`;

const Products = () => {
    const [formattedData, setFormattedData] = useState();
    const {
        data: productData,
        error,
        loading,
    } = useProductsQuery({
        variables: {
            limit: 15,
        },
        notifyOnNetworkStatusChange: true,
    });
    const router = useRouter();

    const handleNewProduct = () => {
        router.push("/admin/newProduct");
    };

    useEffect(() => {
        const data: Product[] = productData?.products.products;

        if (!data) return;

        setFormattedData(
            data.map((item) => ({
                id: item.id,
                name: item.name,
                category: item.category.name,
                photos: item.photos,
                price: item.price,
                description: item.description,
                stock: item.stock,
            }))
        );
    }, [productData]);

    return (
        <>
            <Container>
                <Title>Produtos</Title>
                <div>
                    {formattedData ? (
                        <ProductsTable data={formattedData} />
                    ) : (
                        <span> Carregando produtos...</span>
                    )}
                </div>
                <Button onClick={handleNewProduct}>Novo produto</Button>
            </Container>
        </>
    );
};

export default Products;
