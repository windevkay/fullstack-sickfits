import React, { Component } from 'react';
import {Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import Form from './styles/Form';
import Error from './ErrorMessage';
import {CURRENT_USER_QUERY} from './User';

const RESET_PASSWORD_MUTATION = gql`
    mutation RESET_PASSWORD_MUTATION($resetToken: String!, $password: String!, $confirmPassword: String!){
        resetPassword(resetToken: $resetToken, password: $password, confirmPassword: $confirmPassword){
            id
            name
            email 
        }
    }
`;

class Reset extends Component {
    static propTypes = {
        resetToken: PropTypes.string.isRequired
    } 

    state = {
        password: '',
        confirmPassword: ''
    };

    saveToState = (e) => {
        this.setState({[e.target.name]: e.target.value});
    }

    render() {
        return (
            <Mutation 
                mutation={RESET_PASSWORD_MUTATION} 
                variables={{
                    resetToken: this.props.resetToken,
                    password: this.state.password,
                    confirmPassword: this.state.confirmPassword
                }}
                refetchQueries={[{query: CURRENT_USER_QUERY}]}
                >
                {(resetPassword, {error, loading}) => (
                    <Form method="post" onSubmit={async (e) => {
                        //called lets us know if this mutation has been successfully called or not
                        e.preventDefault();
                        const res = await resetPassword();//you can use this to output some success message or toaster
                        this.setState({password:'', confirmPassword:''});
                    }}>
                        <fieldset disabled={loading} aria-busy={loading}>
                            <h2>Reset your password</h2>
                            <Error error={error}/>
                            <label htmlFor="password">Password
                                <input type="password" name="password" placeholder="Password" value={this.state.password} onChange={this.saveToState}/>
                            </label>
                            <label htmlFor="confirmPassword">Confirm Password
                                <input type="password" name="confirmPassword" placeholder="Confirm password" value={this.state.confirmPassword} onChange={this.saveToState}/>
                            </label>
                            <button type="submit">Reset</button>
                        </fieldset>
                    </Form>
                )}
            </Mutation>
        );
    }
}

export default Reset;