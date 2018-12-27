import {
    EuiButton,
    EuiButtonEmpty,
    EuiFlexGroup,
    EuiFlexItem,
    EuiForm,
    EuiHorizontalRule,
    EuiPage,
    EuiPageBody,
    EuiPageContent,
    EuiPageContentBody,
    EuiSpacer,
    EuiTitle,
    EuiTab,
    EuiBasicTable,
    EuiCheckbox,
} from '@elastic/eui';

import React, { ChangeEvent, Component, Fragment } from 'react';
import { UnauthorizedPrompt } from '../components/unauthorized_prompt'
import { toastNotifications } from 'ui/notify';

export class ManageSpacesACLPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            roles: [],
            activeTab: null,
            activePerm: null,
            selectedTabId: null,

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

    onSelectedTabChanged = id => {
        const { acl } = this.state.space;
        if (!acl)
            return;

        const activePerm = acl[id];

        this.setState({
            selectedTabId: id,
            activePerm
        });
    };

    getColumns() {
        return [
            {
                field: 'role',
                name: 'Role',
                sortable: true
            },
            {
                field: 'c',
                name: 'Can create',
                sortable: true,
                render: (val, row) => {
                    return (
                        <EuiCheckbox
                            id={`${row.role}_c`}
                            checked={val}
                            onChange={e => this.onChangePermission(e, row.role, 'c')}
                        />
                    )
                }
            },
            {
                field: 'r',
                name: 'Can read',
                sortable: true,
                render: (val, row) => {
                    return (
                        <EuiCheckbox
                            id={`${row.role}_r`}
                            checked={val}
                            onChange={e => this.onChangePermission(e, row.role, 'r')}
                        />
                    )
                }
            },
            {
                field: 'u',
                name: 'Can update',
                sortable: true,
                render: (val, row) => {
                    return (
                        <EuiCheckbox
                            id={`${row.role}_u`}
                            checked={val}
                            onChange={e => this.onChangePermission(e, row.role, 'u')}
                        />
                    )
                }
            },
            {
                field: 'd',
                name: 'Can delete',
                sortable: true,
                render: (val, row) => {
                    return (
                        <EuiCheckbox
                            id={`${row.role}_d`}
                            checked={val}
                            onChange={e => this.onChangePermission(e, row.role, 'd')}
                        />
                    )
                }
            }
        ]
    };

    getTableItems() {
        const { roles, activePerm } = this.state;
        if (!roles || !activePerm) {
            return [];
        }

        return roles.map(role => {
            return {
                role: role.value,
                c: activePerm.c.indexOf(role.value) > -1,
                r: activePerm.r.indexOf(role.value) > -1,
                u: activePerm.u.indexOf(role.value) > -1,
                d: activePerm.d.indexOf(role.value) > -1
            }
        });
    }

    getTable() {
        return (
            <EuiBasicTable
                items={this.getTableItems()}
                columns={this.getColumns()}
            />
        )
    }

    getTabs() {
        if (!this.state.roles)
            return;

        const { acl = {} } = this.state.space;

        this.tabs = Object.keys(acl).map(id => {
            return {
                id,
                name: capitalizeFirstLetter(id)
            }
        });

        if (!this.state.selectedTabId && this.tabs.length) {
            this.state.selectedTabId = this.tabs[0].id;
            this.state.activePerm = acl[this.state.selectedTabId];
        }

        return this.tabs.map((tab, index) => (
            <EuiTab
                onClick={() => this.onSelectedTabChanged(tab.id)}
                isSelected={tab.id === this.state.selectedTabId}
                disabled={tab.disabled}
                key={index}
            >
                {tab.name}
            </EuiTab>
        ));
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
                <EuiSpacer />
                {this.getTable()}
                <EuiSpacer />
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