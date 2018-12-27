import React, {Component} from 'react';

import {
    EuiBasicTable,
    EuiLink,
    EuiHealth,
    EuiFlexGroup,
    EuiFlexItem,
    EuiTitle,
    EuiPanel,
    EuiCheckbox
} from '@elastic/eui';

import makeId from '@elastic/eui/lib/components/form/form_row/make_id';

import {getJobVisState} from '../../lib/get_request'

export class ReportViewComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            jobs: [],
            loading: true,
            error: null,
        };
    }

    componentDidMount() {
        this.loadGrid()
    }

    loadGrid = () => {
        const { jobManager } = this.props;

        this.setState({
            loading: true,
            jobs: [],
        });

        const setJobs = (jobs) => {
            this.setState({
                loading: false,
                jobs,
            });
        };

        jobManager
            .getJobs()
            .then(jobs => {
                setJobs(jobs);
            })
            .catch(error => {
                this.setState({
                    loading: false,
                    error,
                });
            });
    };

    isSelectedVis(visualizations) {
        const { vis } = this.props;

        for (let visualize of visualizations) {
            if (visualize.id === vis.id) {
                return true;
            }
        }

        return false;
    }

    onSelect = async (row, selected) => {
        const { vis, jobManager } = this.props;
        this.setState({
            loading: true
        });
        row.vis = row.vis.filter(item => item.id !== vis.id);

        if (selected) {
            row.vis.push(await getJobVisState(vis))
        }

        jobManager.updateVisualizations(row.id, row.vis)
            .then(()=> {
                this.setState({
                    loading: false,
                });
            })
            .catch(error => {
                this.setState({
                    loading: false,
                    error,
                });
            });
    };

    render() {
        const columns = [
            {
                name: 'Selected',
                hideForMobile: false,
                render: (row) => {
                    return <EuiCheckbox id={makeId()} onChange={(e) => this.onSelect(row, e.target.checked)} checked={this.isSelectedVis(row.vis)}/>
                },
            },
            {
                field: 'id',
                name: 'Name',
                sortable: true,
                hideForMobile: false,
                render: (id) => (
                    <EuiLink href={`#/management/kibana/reporting/${id}/edit`}>{id}</EuiLink>
                ),
            },
            {
                field: 'cron',
                name: 'CRON',
                truncateText: true,
                hideForMobile: false
            },
            {
                field: 'subject',
                name: 'Subject',
                truncateText: true,
                hideForMobile: false
            }
        ];

        const getRowProps = (item) => {
            const {id} = item;
            return {
                'data-test-subj': `row-${id}`,
                className: 'customRowClass',
                onClick: () => console.log(`Clicked row ${id}`),
            };
        };

        const getCellProps = (item, column) => {
            const {id} = item;
            const {field} = column;
            return {
                className: 'customCellClass',
                'data-test-subj': `cell-${id}-${field}`,
                textOnly: true,
            };
        };


        return (
            <EuiPanel>
                <EuiFlexGroup wrap>
                    <EuiFlexItem>
                        <EuiTitle size="s">
                            <h1>Reporting</h1>
                        </EuiTitle>
                        <EuiBasicTable
                            items={this.state.jobs}
                            columns={columns}
                            rowProps={getRowProps}
                            cellProps={getCellProps}
                        />

                    </EuiFlexItem>
                </EuiFlexGroup>
            </EuiPanel>
        );
    }
}

