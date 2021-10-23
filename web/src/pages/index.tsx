import React from "react";
import {
    Box,
} from "@chakra-ui/react";

import BoxWrapper from "../components/BoxWrapper";
import Navbar from "../components/Navbar";

interface IndexProps {}

const Index: React.FC<IndexProps> = ({}) => {


    return (
        <>
            <Navbar/>
            <BoxWrapper>
                <Box>Main Content Here</Box>
            </BoxWrapper>
        </>
    );
};

export default Index;
