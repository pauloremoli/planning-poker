import { Box } from '@chakra-ui/layout';
import React from 'react'

interface BoxWrapperProps {
    size?: 'small' | 'medium';
};

const BoxWrapper: React.FC<BoxWrapperProps> = ({ children, size = 'medium' }) => {
    return (
        <Box
            mt={8} mx="auto" maxW={size === "medium" ? "800px" : "400px"}>
            {children}
        </Box>
    )
}

export default BoxWrapper;
