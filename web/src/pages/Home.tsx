import React from "react";
import Announcement from "../components/Announcement";
import Navbar from "../components/Navbar";
import Slider from "../components/Slider";

const announcementText =
    "Descontos de 10% nos pacotes Luxo no mês de Novembro. Cupom de desconto: #NOV10";

const Home: React.FC<{}> = ({}) => {
    return (
        <>
            <Announcement content={announcementText} />
            <Navbar />
            <Slider />
        </>
    );
};

export default Home;
