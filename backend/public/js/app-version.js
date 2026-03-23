const appColumns = [
    {
        data: 'name',
        name: 'name',
        title: 'Name',
        orderable: true,
        searchable: true,
    },
    {
        data: 'version',
        name: 'version',
        title: 'version',
        orderable: true,
        searchable: true,
    },
    {
        data: 'is_maintenance',
        name: 'is_maintenance',
        title: 'isMaintenance',
        className: 'text-nowrap',
        width: 'auto',
        orderable: true,
        searchable: true,
        render: function (data) {
            return `
                <span class="badge badge-light-${data === true ? 'success' : 'danger'}">${typeof data === 'boolean' && data === true ? 'Yes' : 'No'}</span>
            `;
        },
    },
    {
        data: 'is_partial_update',
        name: 'is_partial_update',
        title: 'isPartialUpdate',
        className: 'text-nowrap',
        width: 'auto',
        orderable: true,
        searchable: true,
        render: function (data) {
            return `
                <span class="badge badge-light-${data === true ? 'success' : 'danger'}">${typeof data === 'boolean' && data === true ? 'Yes' : 'No'}</span>
            `;
        },
    },
    {
        data: 'is_force_update',
        name: 'is_force_update',
        title: 'isForceUpdate',
        className: 'text-nowrap',
        width: 'auto',
        orderable: true,
        searchable: true,
        render: function (data) {
            return `
                <span class="badge badge-light-${data === true ? 'success' : 'danger'}">${typeof data === 'boolean' && data === true ? 'Yes' : 'No'}</span>
            `;
        },
    },
    {
        data: 'updatedAt',
        name: 'updatedAt',
        title: 'Last Updated On',
        className: 'text-nowrap',
        width: 'auto',
        orderable: true,
        searchable: true,
        render: function (data) {
            if (!data) return '-';

            const date = new Date(data);

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
            const year = date.getFullYear();

            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours === 0 ? 12 : hours;

            return `
        <span class="text-muted">
            ${day}/${month}/${year} ${hours}:${minutes} ${ampm}
        </span>`;
        },
    },
    {
        data: 'Actions',
        name: 'Actions',
        title: 'Actions',
        orderable: false,
        searchable: false,
        width: '15%',
        render: function (data, type, row) {
            return `
                <a class="btn btn-light btn-active-light-primary btn-sm" type="button" href="/app-version/update/${row.id}">
                    Edit
                </a>
            </div>
        `;
        },
    },
];

const tableSelector = '#device-table';
const url = '/app-version';
let table;

$(document).ready(function () {
    table = $(tableSelector).DataTable({
        serverSide: true, // Enable server-side processing
        processing: true, // Show processing indicator
        paging: true, // Enable pagination
        lengthMenu: [10, 25, 50, 100], // Page length options
        pageLength: 10, // Default page length
        order: [[0, 'asc']], // Default sorting
        ajax: {
            url: `${url}/list`,
            type: 'GET',
            data: function (d) {},
        },
        columns: appColumns,
    });
});
