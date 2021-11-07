import { Head } from "next/document";
import React from "react";
import styled from "styled-components";
import Announcement from "../components/Announcement";
import Categories from "../components/Categories";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Newsletter from "../components/Newsletter";
import Products from "../components/Products";
import RecentlyAdded from "../components/RecentlyAdded";
import Slider from "../components/Slider";

const Content = styled.div`
    padding: 0 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
`;

const Home: React.FC<{}> = ({}) => {
    return (
        <>
            <Announcement />
            <Navbar />
            <Slider />
            <Content>
                <Categories />
                <Products />
                <RecentlyAdded />
            </Content>
            <Newsletter />
            <Footer />
        </>
    );
};

export default Home;
