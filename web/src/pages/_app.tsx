import { ThemeProvider } from "styled-components";
import GlobalStyle from "../styles/globals";
import Home from "./Home";

const theme = {
    colors: {
        primary: "#000000",
    },
};

interface MyAppProps {
    Component: any;
    pageProps: any;
}

const MyApp: React.FC<MyAppProps> = () => {
    return (
        <>
            <GlobalStyle />
            <ThemeProvider theme={theme}>
                <Home/>
            </ThemeProvider>
        </>
    );
};

export default MyApp;
