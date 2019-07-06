import React from 'react';
import PropTypes from 'prop-types';
import formatMoney from '../lib/formatMoney';
import styled from 'styled-components';
import RemoveFromCart from './RemoveFromCart';

const CartStyles = styled.li`
padding: 1rem 0;
border-bottom: 1px solid ${props => props.theme.lightgrey};
display: grid;
align-items: center;
grid-template-columns: auto 1fr auto;
img {
  margin-right: 10px;
}
h3,
p {
  margin: 0;
}
`;

const CartItem = ({cartItem}) => {
    //check if item has not been deleted
    if(!cartItem.item) return (
    <CartStyles>
        <p>This item has been removed from the store..</p>
        <RemoveFromCart id={cartItem.id}/>
    </CartStyles>
    )
    return (
    <CartStyles>
        <img src={cartItem.item.image} width="100" alt={cartItem.item.title}/>
        <div className="cart-item-details">
        <h3>{cartItem.item.title}</h3>
        <p>
        {formatMoney(cartItem.item.price * cartItem.quantity)}
        {' - '}
        <em>{cartItem.quantity} &times; {formatMoney(cartItem.item.price)}</em> each
        </p>
        </div>
        <RemoveFromCart id={cartItem.id}/>
    </CartStyles>
)};

CartItem.propTypes = {
    cartItem: PropTypes.object.isRequired
}

export default CartItem;