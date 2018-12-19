
import { ShareActionProps } from 'ui/share/share_action';
import React from 'react';
import { ShareContextMenuExtensionsRegistryProvider } from 'ui/share/share_action_registry';
import html2canvas from 'html2canvas';

function reportingProvider(Private) {
    const getShareActions = (shareActionProps) => {
        console.error(shareActionProps);
        const shareActions = [];

        const panelTitle = 'PDF Reports';

        const fn = () => {
            html2canvas(document.getElementsByClassName('visualization')[0]).then(function(canvas) {
                window.open(canvas.toDataURL('image/jpeg'));
            });
        };

        shareActions.push({
            shareMenuItem: {
                name: panelTitle,
                icon: 'document',
                toolTipContent: panelTitle
            },
            panel: {
                title: panelTitle,
                content: (
                    <div>
                        <button onClick={fn}>MAKE PDF</button>
                    </div>
                ),
            },
        });

        return shareActions;
    }


    return {
        id: 'pdfReports',
        getShareActions,
    };
}
ShareContextMenuExtensionsRegistryProvider.register(reportingProvider);