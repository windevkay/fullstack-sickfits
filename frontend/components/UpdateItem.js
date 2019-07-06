import React, { Component } from 'react';
import {Mutation, Query} from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';
import Error from './ErrorMessage';

const SINGLE_ITEM_QUERY = gql`
    query SINGLE_ITEM_QUERY($id: ID!){
        item(where: {id: $id}){
            id 
            title
            description
            price
        }
    }
`;

const UPDATE_ITEM_MUTATION = gql`
    mutation UPDATE_ITEM_MUTATION(
        $id: ID!
        $title: String
        $description: String
        $price: Int
    ){
        updateItem(
            id: $id
            title: $title 
            description: $description
            price: $price
        ){
            id
            title 
            description
            price
        }
    }
`;

class UpdateItem extends Component {
    state = {};

    handleChange = (e) => {
        const {value, type, name} = e.target;
        //all inputs come in as string, so if its a number we expect then convert it
        const val = type === 'number' ? parseFloat(value) : value;
        this.setState({[name]: val});
    }

    handleUpdate = async (e, updateItem) => {
        e.preventDefault();
        const res = await updateItem({
            variables:{//redeclare variables in other to add ID to state
                id: this.props.id,
                ...this.state
            }
        });
        //redirect the user after the item creation
        Router.push({pathname:'/'});
    }

    render() {
        return (
            <Query query={SINGLE_ITEM_QUERY} variables={{id: this.props.id}}>
                {({data, loading}) => {
                    if(loading) return <p>Loading...</p>
                    if(!data.item) return <p>No item found...</p>
                    return(
                    <Mutation mutation={UPDATE_ITEM_MUTATION} variables={this.state}>
                    {(updateItem, {loading, error}) => (
                        <Form onSubmit={(e) => this.handleUpdate(e, updateItem)}>
                            <Error error={error} />
                            <fieldset disabled={loading} aria-busy={loading}>
                                <label htmlFor="title">
                                    Title 
                                    <input type="text" 
                                        name="title" 
                                        id="title" 
                                        placeholder="Title" 
                                        defaultValue={data.item.title} 
                                        onChange={this.handleChange}
                                        required />
                                </label>
            
                                <label htmlFor="price">
                                    Price 
                                    <input type="number" 
                                        name="price" 
                                        id="price" 
                                        placeholder="Price" 
                                        defaultValue={data.item.price} 
                                        onChange={this.handleChange}
                                        required />
                                </label>
            
                                <label htmlFor="description">
                                    Description 
                                    <textarea name="description" 
                                        id="description" 
                                        placeholder="Enter a description" 
                                        defaultValue={data.item.description} 
                                        onChange={this.handleChange}
                                        required />
                                </label>
                                <button type="submit">Sav{loading ? 'ing' : 'e'} Changes</button>
                            </fieldset>
                        </Form>
                    )}
                    </Mutation>
                );
            }}
            </Query>
        );
    }
}

export default UpdateItem;
export {UPDATE_ITEM_MUTATION};
