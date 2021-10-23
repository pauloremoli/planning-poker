import React from "react";
import { Box, Text } from "@chakra-ui/react";

import BoxWrapper from "../components/BoxWrapper";
import Navbar from "../components/Navbar";
import { usePostsQuery } from "../generated/graphql";

interface IndexProps {}

const Index: React.FC<IndexProps> = ({}) => {
    const { data } = usePostsQuery();

    return (
        <>
            <Navbar />
            <BoxWrapper>
                <Box>
                    {!data?.posts ? 
                    (
                        <Box>
                            <Text>No posts to show...</Text>
                        </Box>
                    ) :
                    (
                        data?.posts.map((post) => (
                            <Box key={post.id}>
                                <Text ml={2}>{post.title}</Text>
                            </Box>
                        ))
                    )}
                </Box>
            </BoxWrapper>
        </>
    );
};

export default Index;
