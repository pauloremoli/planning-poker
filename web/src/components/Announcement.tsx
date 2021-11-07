import React from "react";
import styled from "styled-components";
import { announcements } from "./data";

const Container = styled.div`
    height: 30px;
    background-color: teal;
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Announcement: React.FC<{}> = () => {
    return (
        <>
            <Container>{announcements}</Container>
        </>
    );
};

export default Announcement;
