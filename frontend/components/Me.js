import React, { Component } from 'react';
import {CURRENT_USER_QUERY} from './User';
import OrderItemStyles from './styles/OrderItemStyles';
import Error from './ErrorMessage';
import { Query } from 'react-apollo';
import SignIn from './Signin';

class Me extends Component {
  render() {
    return (
        <Query query={CURRENT_USER_QUERY}>
            {({data, error}) => {
                if(error) return <Error error={error}/>
                const {me} = data;
                if(!me) return <SignIn/>
                return <OrderItemStyles>
                    <p>Hi {me.name}</p>
                    <p>{me.email}</p>
                </OrderItemStyles>
            }}
        </Query>
    )
  }
};

export default Me;
