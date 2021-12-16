import GlobalStyle from "../styles/globals";

interface MyAppProps {
    Component: any;
    pageProps: any;
}

const MyApp: React.FC<MyAppProps> = ({ Component, pageProps }) => {
    return (
        <>
            <GlobalStyle />
            <Component {...pageProps} />
        </>
    );
};

export default MyApp;
