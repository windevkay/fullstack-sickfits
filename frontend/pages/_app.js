import App, {Container} from 'next/app';
import {ApolloProvider} from 'react-apollo';
import withData from '../lib/withData';
import Page from '../components/Page';

class MyApp extends App {
    static async getInitialProps({Component, ctx}){
        //this function crawls a page/component for any queries or mutations it may have
        //and makes them available in the pageProps object
        //on render, the pageProps are spread back into the component
        let pageProps = {};
        if(Component.getInitialProps){
            pageProps = await Component.getInitialProps(ctx);
        }
        pageProps.query = ctx.query;
        return {pageProps};
    }
    render(){
        const {Component, apollo, pageProps} = this.props;
        return(
            <Container>
                <ApolloProvider client={apollo}>
                    <Page>
                        <Component {...pageProps}/>
                    </Page>
                </ApolloProvider>
            </Container>
        );
    }
}

export default withData(MyApp);