import { ArrowLeftOutlined, ArrowRightOutlined } from "@material-ui/icons";
import Image from "next/image";
import React, { useState } from "react";
import styled from "styled-components";
import { sliderData } from "./data";
import SliderInfoContainer from "./SliderInfoContainer";

const Container = styled.div`
    width: 100%;
    height: calc(100vh - 90px);
    display: flex;
    position: relative;
    overflow: hidden;
    transition: all 1.5s ease;
`;
interface ArrowProps {
    direction: string;
}

const Arrow = styled.div<ArrowProps>`
    width: 50px;
    height: 50px;
    background-color: lightgray;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    bottom: 0;
    left: ${(props) => props.direction === "left" && "20px"};
    right: ${(props) => props.direction === "right" && "20px"};
    margin: auto;
    cursor: pointer;
    opacity: 0.5;
    z-index: 2;

    &:hover{
        background-color: teal;
        opacity: 1;
        transform: scale(1.5);
    }
`;

interface WrapperProps {
    slideIndex: number;
}

const Wrapper = styled.div<WrapperProps>`
    height: 100%;
    display: flex;
    transition: all 1.5s ease;
    transform: translateX(${(props) => props.slideIndex * -100}vw);
`;

interface SlideProps {
    bgColor?: string;
}

const Slide = styled.div<SlideProps>`
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    background-color: #${(props) => props.bgColor};
`;

const ImgContainer = styled.div`
    height: 100%;
    width: 100%;
    flex: 1;
    position: relative;
`;

const Slider: React.FC<{}> = () => {
    const [slideIndex, setSlideIndex] = useState(0);

    const handleClick = (direction: string) => {
        if (direction === "left") {
            setSlideIndex((previous) =>
                previous === 0 ? sliderData.length - 1 : previous - 1
            );
        } else {
            setSlideIndex((previous) =>
                previous === sliderData.length - 1 ? 0 : previous + 1
            );
        }
    };
    return (
        <>
            <Container>
                <Arrow direction="left" onClick={() => handleClick("left")}>
                    <ArrowLeftOutlined />
                </Arrow>
                <Wrapper slideIndex={slideIndex}>
                    {sliderData.map((data) => (
                        <>
                            <Slide bgColor={data.bgColor} key={data.title}>
                                <ImgContainer>
                                    <Image
                                        src={data.img}
                                        width="100%"
                                        height="100%"
                                        layout="responsive"
                                        objectFit="contain"
                                    />
                                </ImgContainer>
                                <SliderInfoContainer
                                    title={data.title}
                                    description={data.description}
                                    btnText={data.btnText}
                                    bgColor={data.bgColor}
                                />
                            </Slide>
                        </>
                    ))}
                </Wrapper>
                <Arrow direction="right" onClick={() => handleClick("right")}>
                    <ArrowRightOutlined />
                </Arrow>
            </Container>
        </>
    );
};

export default Slider;
