import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Query} from 'react-apollo';
import gql from 'graphql-tag';
import Error from './ErrorMessage';
import Head from 'next/head';
import {format} from 'date-fns';
import formatMoney from '../lib/formatMoney';
import OrderStyles from './styles/OrderItemStyles';

const SINGLE_ORDER_QUERY = gql`
    query SINGLE_ORDER_QUERY($id: ID!){
        order(id: $id){
            id 
            charge 
            total 
            createdAt
            user {
                id
                name
            }
            items {
                id 
                title 
                description
                image
                quantity
                price
            }
        }
    }
`;

class Order extends Component {
static propTypes = {
    id: PropTypes.string.isRequired
}
  render() {
    return (
        <Query query={SINGLE_ORDER_QUERY} variables={{id: this.props.id}}>
            {({data, error, loading}) => {
                if(error) return <Error error={error}/>
                if(loading) return <p>Loading...</p>
                const order = data.order;
                return (
                    <OrderStyles>
                        <Head><title>Sick Fits | Orders for {order.user.name}</title></Head>
                        <p>
                            <span>Order id:</span> 
                            <span>{this.props.id}</span>
                        </p>
                        <p>
                            <span>Charge:</span> 
                            <span>{order.charge}</span>
                        </p>
                        <p>
                            <span>Date:</span> 
                            <span>{format(order.createdAt, 'MMMM D, YYYY h:mm A')}</span>
                        </p>
                        <p>
                            <span>Order Total:</span> 
                            <span>{formatMoney(order.total)}</span>
                        </p>
                        <p>
                            <span>Item Count:</span> 
                            <span>{order.items.length}</span>
                        </p>
                        <div className="items" data-test="order">
                        {order.items.map(item => (
                            <div className="order-item" key={item.id}>
                                <img src={item.image} alt={item.title} width="50px"/>
                                <div className="item-details">
                                    <h2>{item.title}</h2>
                                    <p>Qty: {item.quantity}</p>
                                    <p>Each: {formatMoney(item.price)}</p>
                                    <p>Subtotal: {formatMoney(item.price * item.quantity)}</p>
                                    <p>{item.description}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </OrderStyles>
                );
            }}
        </Query>
    )
  }
}

export default Order;
export {SINGLE_ORDER_QUERY};
