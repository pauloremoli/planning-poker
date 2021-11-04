import React from "react";
import styled from "styled-components";

const Container = styled.div`
    height: 30px;
    background-color: teal;
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

interface AnnouncementProps {
    content: string;
}

const Announcement: React.FC<AnnouncementProps> = ({ content }) => {
    return (
        <>
            <Container>{content}</Container>
        </>
    );
};

export default Announcement;
