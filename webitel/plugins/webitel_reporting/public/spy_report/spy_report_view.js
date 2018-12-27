import React, { Component } from 'react';

import {
    EuiEmptyPrompt,
    EuiFlexGroup,
    EuiFlexItem,
    EuiLoadingChart,
    EuiPanel,
    EuiSpacer,
    EuiText,
} from '@elastic/eui';

import { InspectorView } from 'ui/inspector';

class ReportViewComponent extends Component {
    componentDidMount() {
        debugger
        this.props.adapters.data.on('change', this.onUpdateData);
    }

    onUpdateData(type, a, b) {
        console.error(type, a, b)
    }
    render() {
        return (
            <InspectorView useFlex={true}>
                <EuiEmptyPrompt
                    title={<h2>No data available</h2>}
                    body={
                        <React.Fragment>
                            <p>The element did not provide any data.</p>
                        </React.Fragment>
                    }
                />
            </InspectorView>
        );
    }
}

const ReportView = {
    title: 'Report',
    order: 11,
    help: `View the report behind the visualization`,
    shouldShow(adapters) {
        return Boolean(adapters.data);
    },
    component: ReportViewComponent
};

export { ReportView };