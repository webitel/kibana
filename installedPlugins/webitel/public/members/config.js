/**
 * Created by igor on 12.06.16.
 */

define(function () {
    return {
        handleName: 'queueList',
        columns: [
            { title: 'Time', field: 'Time', show: true, filter: '', 'sortable': 'Time', 'groupable': 'Time' },
            { title: 'Caller Name', field: 'CC_Member_CID_Name', show: true, filter: '', 'sortable': 'CC_Member_CID_Name', 'groupable': 'CC-Member-CID-Name' },
            { title: 'Caller Number', field: 'CC_Member_CID_Number', show: true, 'sortable': 'CC-Member-CID-Number', 'groupable': 'CC-Member-CID-Number' },
            { title: 'Queue', field: 'CC_Queue', show: true, 'sortable': 'CC-Queue', 'groupable': 'CC-Queue' },
            { title: 'Agent', field: 'CC_Agent', show: true, 'sortable': 'CC-Agent', 'groupable': 'CC-Agent' },
            { title: 'Join position', field: 'cc_start_position', show: true, 'sortable': 'cc_start_position', 'groupable': 'cc_start_position' },
            { title: 'Position', field: 'cc_current_position', show: true, 'sortable': 'cc_current_position', 'groupable': 'cc_current_position' },
            { title: 'Status', field: 'status', show: true, 'sortable': 'status', 'groupable': 'status' },
        ]
    }
});