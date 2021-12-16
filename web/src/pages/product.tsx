import { useRouter } from "next/router";
import styled from "styled-components";
import Announcement from "../components/Announcement";
import { productsData } from "../components/data";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { mobile } from "../utils/responsive";

const Container = styled.div``;

const Wrapper = styled.div`
    padding: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    ${mobile({ padding: "10px", flexDirection: "column" })}
`;

const ImgContainer = styled.div`
    flex: 1;
`;

const Image = styled.img`
    width: 100%;
    height: 90vh;
    object-fit: cover;
    ${mobile({ height: "40vh" })}
`;

const InfoContainer = styled.div`
    flex: 1;
    padding: 0px 50px;
    ${mobile({ padding: "10px" })}
`;

const Title = styled.h1`
    font-weight: 200;
`;

const Desc = styled.p`
    margin: 20px 0px;
`;

const Price = styled.span`
    font-weight: 100;
    font-size: 40px;
`;

const FilterContainer = styled.div`
    width: 50%;
    margin: 30px 0px;
    display: flex;
    justify-content: space-between;
    ${mobile({ width: "100%" })}
`;

const Filter = styled.div`
    display: flex;
    align-items: center;
`;

const FilterTitle = styled.span`
    font-size: 20px;
    font-weight: 200;
`;

const FilterSize = styled.select`
    margin-left: 10px;
    padding: 5px;
`;

const FilterSizeOption = styled.option``;

const AddContainer = styled.div`
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    ${mobile({ width: "100%" })}
`;

const Button = styled.button`
    padding: 15px;
    border: 2px solid teal;
    font-size: 20px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.5s ease;
    background-color: teal;
    color: white;

    &:hover {
        background-color: #017070;
    }
`;

const Product: React.FC<{}> = () => {
    const { query } = useRouter();

    const productId = query.id ? +query.id : undefined;
    const product = productsData.find((product) => productId === product.id);


    return (
        <Container>
            <Announcement />
            <Navbar />
            <Wrapper>
                {!product ? (
                    <Title>Product not found</Title>
                ) : (
                    <>
                        <ImgContainer>
                            <Image src={product.img} />
                        </ImgContainer>
                        <InfoContainer>
                            <Title>{product.title}</Title>
                            <Desc>
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Donec venenatis, dolor in
                                finibus malesuada, lectus ipsum porta nunc, at
                                iaculis arcu nisi sed mauris. Nulla fermentum
                                vestibulum ex, eget tristique tortor pretium ut.
                                Curabitur elit justo, consequat id condimentum
                                ac, volutpat ornare.
                            </Desc>
                            <Price>R$ {product.price}</Price>
                            <FilterContainer>
                                <Filter>
                                    <FilterTitle>Kit</FilterTitle>
                                    <FilterSize>
                                        <FilterSizeOption>
                                            Mini table
                                        </FilterSizeOption>
                                        <FilterSizeOption>Vip</FilterSizeOption>
                                        <FilterSizeOption>
                                            Luxo
                                        </FilterSizeOption>
                                    </FilterSize>
                                </Filter>
                            </FilterContainer>
                            <AddContainer>
                                <Button>Adicionar ao carrinho</Button>
                            </AddContainer>
                        </InfoContainer>
                    </>
                )}
            </Wrapper>
            <Footer />
        </Container>
    );
};

export default Product;
