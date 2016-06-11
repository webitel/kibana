/**
 * Created by igor on 11.06.16.
 */

define(function () {
    return {
        name: 'User list',
        subType: "table",
        handleName: 'userList',
        columns: [
            { title: 'Id', field: 'id', visible: true, filter: '' },
            { title: 'Name', field: 'name', visible: true, filter: '' },
            { title: 'Domain', field: 'domain', visible: true },
            { title: 'Online', field: 'online', visible: true, cellTemplate: "<span style='text-align: center;' class='fa fa-circle' ng-class='{\"w-online\" : item[column.field] == true, \"w-offline\" : item[column.field] != true}'></span>" },
            { title: 'Role', field: 'role', visible: true },
            { title: 'Agent', field: 'agent', visible: true },
            //    { title: 'Scheme', field: 'scheme', visible: true },
            //{ title: 'timer', field: 'timer', visible: true, cellTemplate: "<timer>{{timer}}</timer>" },
            { title: 'State', field: 'state', visible: true, ngClass: '{"w-account-onhook" : item[column.field] == "ONHOOK" || item[column.field] == "Waiting", "w-account-nonreg": item[column.field] == "NONREG", "w-account-isbusy": item[column.field] == "ISBUSY" || item[column.field] == "In a queue call", "w-account-receiving": item[column.field] == "Receiving"}' },
            { title: 'Status', field: 'status', visible: true },
            { title: 'Description', field: 'description', visible: true },
        ]
    }
});