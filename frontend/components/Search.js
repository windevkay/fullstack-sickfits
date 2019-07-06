import React from 'react';
import Downshift, {resetIdCounter} from 'downshift';
import Router from 'next/router';
import gql from 'graphql-tag';
import {ApolloConsumer} from 'react-apollo';
import debounce from 'lodash.debounce';
import {DropDown, DropDownItem, SearchStyles} from './styles/DropDown';

const SEARCH_ITEMS_QUERY = gql`
    query SEARCH_ITEMS_QUERY($searchTerm: String!){
        items(where: {
            OR: [ #this technique ensures the search param for a match is one OR the other, not necessarily both  
                {title_contains: $searchTerm}, {description_contains: $searchTerm}]
        }){
            id
            image
            title
        }
    }
`;

function routeToItem(item){
    Router.push({
        pathname: '/item',
        query: {id: item.id}
    });
}

class AutoComplete extends React.Component{
    state = {
        items: [],
        loading: false 
    }

    onChange = debounce(async (e, client) => {
        //debounce will help to take inputs entered speedily and fire off after say 350milli secs 
        //turn loading on
        this.setState({loading: true});
        //query the apollo client
        const res = await client.query({
            query: SEARCH_ITEMS_QUERY,
            variables: {searchTerm: e.target.value}
        });
        //store result into state
        this.setState({
            items: res.data.items,
            loading: false 
        })
    }, 200);

    render(){
        resetIdCounter();
        return (
        <SearchStyles>
            <Downshift itemToString={item => (item === null ? '' : item.title)} onChange={routeToItem}>
            {({getInputProps, getItemProps, isOpen, inputValue, highlightedIndex}) => (
                <div>
                    <ApolloConsumer>
                        {(client) => (
                            <input
                                {...getInputProps({
                                    type: 'search',
                                    placeholder: 'Search for an item..',
                                    id: "search",
                                    className: this.state.loading ? 'loading' : '',
                                    onChange: e => {
                                        e.persist();
                                        this.onChange(e, client);
                                    }
                                })}/>
                        )}
                    </ApolloConsumer>
                    {isOpen && (
                        <DropDown>
                        {this.state.items.map((item, index) => <DropDownItem 
                            {...getItemProps({item})}
                            key={item.id}
                            highlighted={index === highlightedIndex}>
                            <img width="50" src={item.image} alt={item.title}/>
                            {item.title}
                        </DropDownItem>)}
                        {!this.state.items.length 
                            && !this.state.loading 
                            && <DropDownItem>No results found for {inputValue}</DropDownItem>}
                        </DropDown>
                    )}
                </div>
            )}
            </Downshift>
        </SearchStyles>
        );
    }
}

export default AutoComplete;