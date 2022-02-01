import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useProductsQuery } from "../generated/graphql";
import Product from "./Product";
import client from "../apollo-client";

const Container = styled.div`
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 50px;
`;

const Header = styled.h1`
    padding: 20px;
`;

enum Sort {
    NEWEST,
    OLDEST,
    PRICE_ASC,
    PRICE_DESC,
    NAME_ASC,
    NAME_DESC,
}
interface ProcuctsProps {
    category: number;
    cursor: string | null;
    limit: number | null;
    sort: Sort | null;
}

const Products: React.FC<ProcuctsProps> = ({
    limit,
    cursor = null,
    category = null,
    sort = null,
}) => {
    const { data, loading, error } = useProductsQuery(limit);
    const [sortedProducts, setSortedProducts] = useState([]);

    useEffect(() => {
        const sortProducts = () => {
            switch (sort) {
                case Sort.NEWEST: {
                    data?.products.products?.sort((a, b) => {
                        if (a.createdAt < b.createdAt) {
                            return -1;
                        } else if (a.createdAt > b.createdAt) {
                            return 1;
                        }
                        return 0;
                    });
                }
            }
        };

        sortProducts();
    }, [data, sort]);

    return (
        <>
            <Container>
                {sort
                    ? sortedProducts.map((item) => {
                          return <Product item={item} />;
                      })
                    : data?.products?.products?.map((item) => {
                          return <Product item={item} />;
                      })}
            </Container>
        </>
    );
};

export async function getStaticProps<ProductsProps>({
    category,
    sort,
    cursor,
    limit,
}) {
    const { data, loading, error } = useProductsQuery({
        variables: {
            limit: limit,
            cursor: cursor,
            category: category,
        },
    });

    return {
        props: {
            products: data?.products.products,
        },
    };
}

export default Products;
