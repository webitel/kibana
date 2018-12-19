import {
    EuiButton,
    EuiButtonEmpty,
    EuiFieldText,
    EuiFlexGroup,
    EuiFlexItem,
    EuiForm,
    EuiFormRow,
    EuiHorizontalRule,
    EuiLoadingSpinner,
    EuiPage,
    EuiPageBody,
    EuiPageContent,
    EuiPageContentBody,
    EuiSpacer,
    EuiTitle,
} from '@elastic/eui';

import React, { ChangeEvent, Component, Fragment } from 'react';
import { UnauthorizedPrompt } from '../components/unauthorized_prompt'
import { toastNotifications } from 'ui/notify';

export class ManageSpacesACLPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            roles: null,
            activeTab: null,
            activePerm: null,

            createRoles: [],
            readRoles: [],
            updateRoles: [],
            deleteRoles: [],

            space: {},
        };
    }

    componentDidMount() {
        const { spaceId, spacesManager } = this.props;

        if (spaceId) {
            spacesManager
                .getSpace(spaceId)
                .then((result) => {
                    if (result.data) {
                        this.setState({
                            space: result.data,
                            isLoading: false,
                        });
                    }
                    this.loadRoles();
                })
                .catch(error => {
                    const { message = '' } = error.data || {};

                    toastNotifications.addDanger(`Error loading space: ${message}`);
                    this.backToSpacesList();
                });
        } else {
            this.setState({ isLoading: false });
        }
    }

    loadRoles() {
        const { roleManager } = this.props;
        roleManager.getRoles()
            .then(result => {
                const { roles = []} = result;
                this.setState({roles: arrayToOptions(roles)});
            })
            .catch(error => {
                const { message = '' } = error.data || {};

                toastNotifications.addDanger(`Error loading roles: ${message}`);
                this.backToSpacesList();
            })
    }

    render() {
        return (
            <EuiPage className="euiPage--restrictWidth-default">
                <EuiPageBody>
                    <EuiPageContent>
                        <EuiPageContentBody>{this.getForm()}</EuiPageContentBody>
                    </EuiPageContent>
                </EuiPageBody>
            </EuiPage>
        );
    }

    saveSpace() {
        const { spacesManager } = this.props;
        const name = this.state.space.name || '';

        spacesManager
            .updateSpace(this.state.space)
            .then(() => {
                toastNotifications.addSuccess(`'${name}' was saved`);
                window.location.hash = `#/management/security_spaces/list`;
            })
            .catch(error => {
                const { message = '' } = error.data || {};
                toastNotifications.addDanger(`Error saving space: ${message}`);
            });
    }

    getFormHeading = () => {
        const {id} = this.state.space;
        return (
            <EuiTitle size="l">
                <h1>
                    Access control: {id} space.
                </h1>
            </EuiTitle>
        );
    };

    getFormButtons = () => {
        const saveText = 'Update space';
        return (
            <EuiFlexGroup responsive={false}>
                <EuiFlexItem grow={false}>
                    <EuiButton fill onClick={this.saveSpace.bind(this)} data-test-subj="save-space-button">
                        {saveText}
                    </EuiButton>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                    <EuiButtonEmpty onClick={this.backToSpacesList} data-test-subj="cancel-space-button">
                        Cancel
                    </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={true} />
            </EuiFlexGroup>
        );
    };

    getRow(role, key) {

        return (
            <tr>
               <td>
                   {role.value}
               </td>

                <td>
                    <input type="checkbox" checked={this.state.activePerm.c.indexOf(role.value) !== -1} onChange={e => this.onChangePermission(e, role.value, 'c')}/>
                </td>
                <td>
                    <input type="checkbox" checked={this.state.activePerm.r.indexOf(role.value) !== -1} onChange={e => this.onChangePermission(e, role.value, 'r')}/>
                </td>
                <td>
                    <input type="checkbox" checked={this.state.activePerm.u.indexOf(role.value) !== -1} onChange={e => this.onChangePermission(e, role.value, 'u')}/>
                </td>
                <td>
                    <input type="checkbox" checked={this.state.activePerm.d.indexOf(role.value) !== -1} onChange={e => this.onChangePermission(e, role.value, 'd')}/>
                </td>
            </tr>
        )
    };

    addRoleToAction(role, action) {
        const { activePerm } = this.state;

        if (~activePerm[action].indexOf(role)) {
            return
        }
        activePerm[action].push(role);
        this.setState({activePerm});

    }

    removeRoleFromAction(role, action) {
        const { activePerm } = this.state;
        const idx = activePerm[action].indexOf(role);

        if (!~idx) {
            return
        }

        activePerm[action].splice(idx, 1);
        this.setState({activePerm});
    }

    onChangePermission(e, role = '', action = '') {
        if (e.target.checked) {
            this.addRoleToAction(role, action)
        } else {
            this.removeRoleFromAction(role, action)
        }
    }

    setActiveTab(activeTab) {
        const { acl } = this.state.space;
        if (!acl)
            return;

        const activePerm = acl[activeTab];

        this.setState({activeTab, activePerm});

    }

    getTabs() {
        if (!this.state.roles)
            return;

        const { acl = {} } = this.state.space;
        const tabs = Object.keys(acl).map(id => {
            if (!this.state.activeTab) {
                this.state.activeTab = id;
                this.state.activePerm = acl[id];
            }
            return (
                <button key={id} className={`kuiTab ${this.state.activeTab === id ? 'kuiTab-isSelected' : ''}`} onClick={()=> this.setActiveTab(id)}>
                    {capitalizeFirstLetter(id)}
                </button>
            )
        });

        return (
            <div>
                <div className="kuiTabs kuiVerticalRhythm">
                    {tabs}
                </div>
                <form role="form" className="kuiFieldGroup kuiVerticalRhythm">
                    <table className="kbn-table table">
                        <thead>
                            <tr>
                                <th>
                                    Role
                                </th>
                                <th>
                                    Can create
                                </th>
                                <th>
                                    Can read
                                </th>
                                <th>
                                    Can update
                                </th>
                                <th>
                                    Can delete
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                        {this.state.roles.map((r, i) => this.getRow(r, i))}
                        </tbody>
                    </table>
                    <div className="kuiFieldGroupSection kuiFieldGroupSection--wide">
                        {/*{this.getTabContent(acl)}*/}
                    </div>
                </form>
            </div>
        )
    };

    getForm = () => {
        const { userProfile } = this.props;

        if (!userProfile.hasCapability('manageSpaces')) {
            return <UnauthorizedPrompt />;
        }

        return (
            <EuiForm>
                {this.getFormHeading()}

                <EuiSpacer />

                {this.getTabs()}

                {/*{this.getIndexPatternAcl()}*/}

                <EuiHorizontalRule />
                {this.getFormButtons()}
            </EuiForm>
        )
    };

    backToSpacesList = () => {
        window.location.hash = `#/management/security_spaces/list`;
    };
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function arrayToOptions(arr = []) {
    return arr.map(i => {
        return {value: i, label: i};
    })
}