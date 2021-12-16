import styled from "styled-components";
import Navbar from "../components/Navbar";
import Announcement from "../components/Announcement";
import Products from "../components/Products";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";
import { mobile } from "../utils/responsive";
import { categoriesData } from "../components/data";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";

const Container = styled.div``;

const Title = styled.h1`
    margin: 20px;
`;

const FilterContainer = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Filter = styled.div`
    margin: 20px;
    ${mobile({ width: "0px 20px", display: "flex", flexDirection: "column" })}
`;

const FilterText = styled.span`
    font-size: 20px;
    font-weight: 600;
    margin-right: 20px;
    ${mobile({ marginRight: "0px" })}
`;

const Select = styled.select`
    padding: 10px;
    margin-right: 20px;
    ${mobile({ margin: "10px 0px" })}
`;
const Option = styled.option``;

const ProductList = () => {
    const { query } = useRouter();

    const categoryId = query.category ? +query.category : undefined;
    const category = categoriesData.find(
        (category) => categoryId === category.id
    );

    return (
        <Container>
            <Announcement />
            <Navbar />
            <FilterContainer>
                <Filter>
                    <FilterText>Filtro por categoria:</FilterText>
                    <Select>
                        <Option disabled selected>
                            Category
                        </Option>
                        {categoriesData.map((item) => {
                            if (category && category.title === item.title) {
                                return <Option selected> {item.title} </Option>;
                            } else {
                                return <Option> {item.title} </Option>;
                            }
                        })}
                    </Select>
                </Filter>
                <Filter>
                    <FilterText>Ordernas temas:</FilterText>
                    <Select>
                        <Option selected>Mais novos</Option>
                        <Option>Nome</Option>
                        <Option>Mais alugados</Option>
                    </Select>
                </Filter>
            </FilterContainer>
            <Products />
            <Footer />
        </Container>
    );
};

export default ProductList;
