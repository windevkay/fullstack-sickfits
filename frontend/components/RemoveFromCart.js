import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import styled from 'styled-components';
import {CURRENT_USER_QUERY} from './User';

const BigButton = styled.button`
  font-size: 3rem;
  background: none;
  border: 0;
  &:hover {
    color: ${props => props.theme.red};
    cursor: pointer;
  }
`;

const REMOVE_FROM_CART_MUTATION = gql`
    mutation REMOVE_FROM_CART_MUTATION($id: ID!){
        removeFromCart(id: $id){
            id
        }
    }
`;

class RemoveFromCart extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired
  }
  //gets called immediately after the mutation has returned 
  //the payload would contain the id that is returned from the graphql mutation
  update = (cache, payload) => {
    const data = cache.readQuery({query: CURRENT_USER_QUERY});
    const cartItemId = payload.data.removeFromCart.id;
    //filter out the removed item from the cart items in cache 
    data.me.cart = data.me.cart.filter(cartItem => cartItem.id !== cartItemId);
    //write back to cache
    cache.writeQuery({query: CURRENT_USER_QUERY, data});
  }

  render() {
    return <Mutation 
    mutation={REMOVE_FROM_CART_MUTATION} 
    variables={{id: this.props.id}} 
    update={this.update}
    optimisticResponse={{
        __typename: 'Mutation',
        removeFromCart: {
            __typename: 'CartItem',
            id: this.props.id
        }
    }}
    >
        {(removeFromCart,{loading, error}) => (
            <BigButton 
            disabled={loading}
            onClick={()=>{
                removeFromCart().catch(err => alert(err.message));
            }}
            title="Delete item">&times;</BigButton>
        )}
    </Mutation>
  }
}

export default RemoveFromCart;
