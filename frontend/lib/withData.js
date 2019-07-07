import withApollo from 'next-with-apollo';
import ApolloClient from 'apollo-boost';
import { endpoint, prodEndpoint } from '../config';
import {LOCAL_STATE_QUERY} from '../components/Cart';

function createClient({ headers }) {
  return new ApolloClient({
    uri: process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
    request: operation => {
      operation.setContext({
        fetchOptions: {
          //this option ensures any credentials of logged in users e.g. cookies 
          //are passed along with each request
          credentials: 'include',
        },
        headers,
      });
    },
    //configuration for local data/local state - data which lives in the browser
    clientState: {
      resolvers: {
        Mutation: {
          toggleCart(_, variables, {cache}){
            //read the cartOpen value from the cache 
            const {cartOpen} = cache.readQuery({
              query: LOCAL_STATE_QUERY
            });
            //write the opposite value back to cache 
            const data = {
              data: {cartOpen: !cartOpen}//toggle cartOpen 
            }
            cache.writeData(data);
            return data;
          }
        }
      },
      defaults: {
        cartOpen: false,
      }
    }
  });
}

export default withApollo(createClient);
