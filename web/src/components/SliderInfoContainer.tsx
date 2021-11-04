import React from "react";
import styled from "styled-components";

interface InfoContainerProps {
    bgColor?: string;
}

const InfoContainer = styled.div<InfoContainerProps>`
    flex: 1;
    padding: 50px;
    justify-content: center;
    position: relative;
    display: flex;
    flex-direction: column;
`;

const Title = styled.h1`
    font-size: 70px;
`;

const Description = styled.p`
    margin: 50px 0px;
    font-size: 20px;
    font-weight: 500;
    letter-spacing: 3px;
`;

const Button = styled.button`
    padding: 10px;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    width: 500px;
    background-color: transparent;
    cursor: pointer;
`;

interface SliderInfoContainerProps {
    title: string;
    description: string;
    btnText: string;
    bgColor?: string;
}

const SliderInfoContainer: React.FC<SliderInfoContainerProps> = ({
    title,
    description,
    btnText,
    bgColor,
}) => {
    return (
        <InfoContainer bgColor={bgColor}>
            <Title>{title.toUpperCase()}</Title>
            <Description>{description.toUpperCase()}</Description>
            <Button>{btnText.toUpperCase()}</Button>
        </InfoContainer>
    );
};

export default SliderInfoContainer;
