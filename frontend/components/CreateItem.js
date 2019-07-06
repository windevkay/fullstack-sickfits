import React, { Component } from 'react';
import {Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';
import Error from './ErrorMessage';

const CREATE_ITEM_MUTATION = gql`
    mutation CREATE_ITEM_MUTATION(
        $title: String!
        $description: String!
        $price: Int!
        $image: String
        $largeImage: String
    ){
        createItem(
            title: $title 
            description: $description
            price: $price
            image: $image 
            largeImage: $largeImage
        ){
            id
        }
    }
`;

class CreateItem extends Component {
    state = {
        title: '',
        description: '',
        image: '',
        largeImage: '',
        price: ''
    };

    handleChange = (e) => {
        const {value, type, name} = e.target;
        //all inputs come in as string, so if its a number we expect then convert it
        const val = type === 'number' ? parseFloat(value) : value;
        this.setState({[name]: val});
    }

    uploadImage = async (e) => {
        //pull the file out of the event
        const files = e.target.files;
        //use javascript form data api to prep the data 
        const data = new FormData();
        data.append('file', files[0]);
        //add the upload preset required by cloudinary 
        data.append('upload_preset', 'sickfits');
        //call the cloudinary api
        const res = await fetch('https://api.cloudinary.com/v1_1/dw8yxwteb/image/upload', {
            method: 'POST', 
            body: data
        });
        //convert the api response to JSON
        const file = await res.json();
        this.setState({
            image: file.secure_url,
            largeImage: file.eager[0].secure_url
        });
    }

    render() {
        return (
            <Mutation mutation={CREATE_ITEM_MUTATION} variables={this.state}>
            {(createItem, {loading, error}) => (
                <Form 
                data-test="form"
                onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await createItem();
                    //redirect the user after the item creation
                    Router.push({pathname:'/item', query:{id: res.data.createItem.id}});
                }}>
                    <Error error={error} />
                    <fieldset disabled={loading} aria-busy={loading}>
                        <label htmlFor="file">
                            Image 
                            <input type="file" 
                                name="file" 
                                id="file" 
                                placeholder="Upload Image" 
                                onChange={this.uploadImage}
                                required />
                            {this.state.image && <img src={this.state.image} alt="Upload Image" />}
                        </label>
                        <label htmlFor="title">
                            Title 
                            <input type="text" 
                                name="title" 
                                id="title" 
                                placeholder="Title" 
                                value={this.state.title} 
                                onChange={this.handleChange}
                                required />
                        </label>
    
                        <label htmlFor="price">
                            Price 
                            <input type="number" 
                                name="price" 
                                id="price" 
                                placeholder="Price" 
                                value={this.state.price} 
                                onChange={this.handleChange}
                                required />
                        </label>
    
                        <label htmlFor="description">
                            Description 
                            <textarea name="description" 
                                id="description" 
                                placeholder="Enter a description" 
                                value={this.state.description} 
                                onChange={this.handleChange}
                                required />
                        </label>
                        <button type="submit">Submit</button>
                    </fieldset>
                </Form>
            )}
            </Mutation>
        );
    }
}

export default CreateItem;
export {CREATE_ITEM_MUTATION};
