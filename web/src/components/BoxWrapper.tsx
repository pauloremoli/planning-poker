import { Box } from '@chakra-ui/layout';
import React from 'react'

interface BoxWrapperProps {
    size?: 'small' | 'medium';
};

const BoxWrapper: React.FC<BoxWrapperProps> = ({ children, size = 'medium' }) => {
    return (
        <Box
            mx="auto" maxW={size === "medium" ? "1024px" : "400px"}>
            {children}
        </Box>
    )
}

export default BoxWrapper;
