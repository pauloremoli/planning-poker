import {
    FavoriteBorderOutlined,
    SearchOutlined,
    ShoppingCartOutlined,
} from "@material-ui/icons";
import styled from "styled-components";
import Image from "next/image";
import NextLink from "next/link";

const Info = styled.div`
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.5s ease;
    cursor: pointer;
`;

const Container = styled.div`
    flex: 1;
    margin: 5px;
    min-width: 280px;
    height: 350px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e2f9ff;
    position: relative;
    flex-wrap: wrap;

    &:hover ${Info} {
        opacity: 1;
    }
`;

const Title = styled.h1`
    color: white;
    font-size: 20px;
    font-weight: 600;
`;

const IconContainer = styled.div`
    display: flex;
    margin-top: 30px;
`;

const Icon = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px;
    transition: all 0.5s ease;
    &:hover {
        background-color: #e9f5f5;
        transform: scale(1.1);
    }
`;

type Item = {
    title: string;
    img: string;
    id: number;
};

interface ProductProps {
    item: Item;
}

const Product: React.FC<ProductProps> = ({ item }) => {
    return (
        <Container key={item.id}>
            <Image src={item.img} layout="fill" objectFit="cover" />
            <NextLink href={`/product?id=${item.id}`}>
                <Info>
                    <Title>{item.title} </Title>
                    <IconContainer>
                        <Icon>
                            <NextLink href={`/cart?id=${item.id}`}>
                                <ShoppingCartOutlined />
                            </NextLink>
                        </Icon>
                        <Icon>
                            <NextLink href={`/product?id=${item.id}`}>
                                <SearchOutlined />
                            </NextLink>
                        </Icon>
                        <Icon>
                            <NextLink href={`/favorites?id=${item.id}`}>
                                <FavoriteBorderOutlined />
                            </NextLink>
                        </Icon>
                    </IconContainer>
                </Info>
            </NextLink>
        </Container>
    );
};

export default Product;
