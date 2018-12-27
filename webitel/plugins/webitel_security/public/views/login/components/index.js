import React, { Component, Fragment } from 'react';

import {
    EuiPage,
    EuiPageBody,
    EuiPageContent,
    EuiPageContentBody,
    EuiPageContentHeader,
    EuiPageContentHeaderSection,
    EuiTitle,
    EuiForm,
    EuiFormRow,
    EuiFieldText,
    EuiButton,
    EuiPanel,
    EuiCallOut,
    EuiSpacer,
} from '@elastic/eui';


export class LoginPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isValid: false,
            username: "",
            password: "",
        }
    }

    componentDidMount() {
        this.setState({isLoading: false})
    }

    onChange(e) {
        e.preventDefault();
        this.setState({
            [e.target.name]: e.target.value
        });
        this.setValid()
    }

    setValid() {
        this.setState({
            isValid: !!this.state.username
        })
    }

    submit(e) {
        e.preventDefault();
        if (!this.state.username) {
            return;
        }

        this.setState({
            isLoading: true
        });


        const { http, window, next } = this.props;

        const { username, password } = this.state;

        http.post('./api/webitel/v1/login', { username, password }).then(
            () => (window.location.href = next),
            (error) => {
                const { statusCode = 500 } = error.data || {};

                let message = 'Oops! Error. Try again.';
                if (statusCode === 401) {
                    message = 'Invalid username or password. Please try again.';
                }

                this.setState({
                    hasError: true,
                    message,
                    isLoading: false,
                });
            }
        );
    }

    renderMessage = () => {
        if (this.state.message) {
            return (
                <Fragment>
                    <EuiCallOut
                        size="s"
                        color="danger"
                        data-test-subj="loginErrorMessage"
                        title={this.state.message}
                        role="alert"
                    />
                    <EuiSpacer size="l"/>
                </Fragment>
            );
        }
    };

    render() {
        return (
            <EuiPage className="login-page">
                <EuiPageBody>
                    <EuiPageContent className="login-form" verticalPosition="center" horizontalPosition="center">
                        <EuiPageContentHeader>
                            <EuiPageContentHeaderSection>
                                <EuiTitle>
                                    <h2>Kibana</h2>
                                </EuiTitle>
                            </EuiPageContentHeaderSection>
                        </EuiPageContentHeader>
                        <EuiPageContentBody>
                            <form onSubmit={ e => this.submit(e)}>
                                <EuiFormRow
                                    label="Username"
                                >
                                    <EuiFieldText
                                        id="username"
                                        name="username"
                                        value={this.state.username}
                                        onChange={(e) => this.onChange(e) }
                                        aria-required
                                    />
                                </EuiFormRow>
                                <EuiFormRow
                                    label="Password"
                                >
                                    <EuiFieldText
                                        id="password"
                                        name="password"
                                        onChange={(e) => this.onChange(e) }
                                        value={this.state.password}
                                        type="password"
                                    />
                                </EuiFormRow>
                                <EuiFormRow
                                >
                                    <EuiButton type="submit" isLoading={this.state.isLoading} isDisabled={!this.state.isValid}>
                                        Login
                                    </EuiButton>
                                </EuiFormRow>
                            </form>
                            {this.renderMessage()}
                        </EuiPageContentBody>
                    </EuiPageContent>
                </EuiPageBody>
            </EuiPage>
        )
    }
}