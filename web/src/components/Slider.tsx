import { ArrowLeftOutlined, ArrowRightOutlined } from "@material-ui/icons";
import Image from "next/image";
import React from "react";
import styled from "styled-components";
import SliderInfoContainer from "./SliderInfoContainer";

const Container = styled.div`
    width: 100%;
    height: calc(100vh - 90px);
    position: relative;
    overflow: hidden;
`;

interface ArrowProps {
    direction: string;
}

const Arrow = styled.div<ArrowProps>`
    z-index: 1;
    width: 50px;
    height: 50px;
    background-color: #f8f8f8;
    display: flex;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    bottom: 0;
    left: ${(props) => props.direction === "left" && "10px"};
    right: ${(props) => props.direction === "right" && "10px"};
    margin: auto;
    cursor: pointer;
`;

const Wrapper = styled.div`
    height: 100%;
    display: flex;
`;

const Slide = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
`;

interface ImgContainerProps {
    bgColor?: string;
}

const ImgContainer = styled.div<ImgContainerProps>`
    height: 100%;
    width: 100%;
    flex: 1;
    position: relative;
    background-color: ${(props) =>
        props.bgColor ? props.bgColor : "transparent"};
`;

const sliderData = [
    {
        img: "/party.svg",
        title: "A decoração com seu estilo",
        description: "Temas variados para diversos tipos de eventos",
        btnText: "ENCONTRE AGORA O SEU TEMA",
        bgColor: "red",
    },
    {
        img: "/party.svg",
        title: "A decoração com seu estilo",
        description: "Temas variados para diversos tipos de eventos",
        btnText: "ENCONTRE AGORA O SEU TEMA",
        bgColor: "green",
    },
];

const Slider: React.FC<{}> = () => {
    return (
        <>
            <Container>
                <Arrow direction="left">
                    <ArrowLeftOutlined />
                </Arrow>
                <Wrapper>
                    <Slide>
                        {sliderData.map((data) => (
                            <>
                                <ImgContainer bgColor={data.bgColor}>
                                    <Image
                                        src={data.img}
                                        layout="fill"
                                        objectFit="scale-down"
                                    />
                                </ImgContainer>
                                <SliderInfoContainer
                                    title={data.title}
                                    description={data.description}
                                    btnText={data.btnText}
                                    bgColor={data.bgColor}
                                />
                            </>
                        ))}
                    </Slide>
                </Wrapper>
                <Arrow direction="right">
                    <ArrowRightOutlined />
                </Arrow>
            </Container>
        </>
    );
};

export default Slider;
