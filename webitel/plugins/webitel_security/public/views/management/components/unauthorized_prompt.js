import { EuiEmptyPrompt } from '@elastic/eui';
import React from 'react';

export const UnauthorizedPrompt = () => (
    <EuiEmptyPrompt
        iconType="spacesApp"
        iconColor={'danger'}
        title={<h2>Permission denied</h2>}
        body={
            <p data-test-subj="permissionDeniedMessage">You do not have permission to manage spaces.</p>
        }
    />
);
