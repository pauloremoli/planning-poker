import React from "react";
import { Box, Text } from "@chakra-ui/react";

import BoxWrapper from "../components/BoxWrapper";
import Navbar from "../components/Navbar";
import { usePostsQuery } from "../generated/graphql";

interface IndexProps { }

const Index: React.FC<IndexProps> = ({ }) => {

    return (
        <>
            <Navbar />
            <BoxWrapper>
                <Box>
                    hello there
                </Box>
            </BoxWrapper>
        </>
    );
};

export default Index;
