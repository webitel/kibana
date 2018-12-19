/**
 * Created by igor on 17.11.16.
 */

import chrome from 'ui/chrome';
import {uiModules} from 'ui/modules';
import kibanaLogoUrl from 'plugins/webitel_main/logo/kibanaWebitel.svg';
import 'plugins/webitel_main/logo/logo.less';

uiModules.get('kibana', [])
    .config(function() {
        chrome
            .setBrand({
                'logo': `url(${kibanaLogoUrl}) 6px 10px/140px 50px no-repeat #212121`,
                'smallLogo': `url(${kibanaLogoUrl}) 6px 10px/140px 50px no-repeat #212121`
            })
    });