/**
 * Created by igor on 11.06.16.
 */

define(function () {
    return {
        name: 'User list',
        subType: "table",
        handleName: 'userList',
        columns: [
            // { title: 'time', field: 'time', visible: true, filter: '', pos: 0 },
            { title: 'uuid', field: 'uuid', visible: false, filter: '', pos: 1 },
            { title: 'State', field: 'callstate', visible: true, class: "label label-state", filter: '', pos: 2 },
            { title: 'CID name', field: 'cid_name', visible: true, pos: 3 },
            { title: 'CID num', field: 'cid_num', visible: true, pos: 4 },
            { title: 'Callee num', field: 'callee_num', visible: true , pos: 5},
            { title: 'Callee name', field: 'callee_name', visible: true, pos: 6 },
            { title: 'Dest', field: 'dest', visible: true, pos: 7 },
            // { title: 'direction', field: 'direction', visible: true, pos: 8 },
            { title: 'IP', field: 'ip_addr', visible: false, pos: 9 },
            { title: 'Read codec', field: 'read_codec', visible: false, pos: 10 },
            { title: 'Write codec', field: 'write_codec', visible: false, pos: 11 },
            { title: 'Domain', field: 'presence_data', visible: false, pos: 12 },
            { title: 'DTMF', field: 'dtmf', visible: true, pos: 13 }
        ]
    }
});