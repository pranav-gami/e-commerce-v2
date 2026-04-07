const filterOptions = {
    search: '',
    filters: {},
};
$.extend(true, $.fn.dataTable.defaults, {
    processing: true,
    serverSide: true,
});

const userColumns = [
    {
        data: null,
        name: 'control',
        title: '',
        orderable: false,
        searchable: false,
        width: '3%',
        render: function () {
            return '';
        },
        orderData: [],
    },
    {
        data: 'id',
        name: 'id',
        title: '<input type="checkbox" class="form-check-input" id="select-all-checkbox">',
        orderable: false,
        searchable: false,
        width: '5%',
        render: function (data) {
            return `<div>
                <input type="checkbox" class="form-check-input row-checkbox" value="${data}">
            </div>`;
        },
    },
    {
        data: 'name',
        name: 'name',
        title: 'Name',
        orderable: true,
        searchable: true,
        render: function (data, type, row) {
            return `<div class="d-flex align-items-center">
                <div class="symbol symbol-50px overflow-hidden me-3">
                    <div class="symbol-label fs-3 bg-light-primary text-primary">
                        ${data ? data.charAt(0).toUpperCase() : '?'}
                    </div>
                </div>
                <a href="/admin/users/${row.id}" class="text-gray-800 text-hover-primary mb-1">
                    ${data || ''}
                </a>
            </div>`;
        },
    },
    {
        data: 'email',
        name: 'email',
        title: 'Email',
        orderable: true,
        searchable: true,
    },
    {
        data: 'role',
        name: 'role',
        title: 'Role',
        orderable: false,
        searchable: false,
        render: function (data) {
            return data === 'ADMIN'
                ? '<span class="badge badge-light-danger">Admin</span>'
                : '<span class="badge badge-light-primary">User</span>';
        },
    },
    {
        data: 'createdAt',
        name: 'createdAt',
        title: 'Joined',
        orderable: true,
        searchable: false,
        render: function (data) {
            return new Date(data).toLocaleDateString();
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
    <div class="dropdown">
      <button class="btn btn-light btn-active-light-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
        Actions
      </button>
      <div class="dropdown-menu menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-125px py-4">
        <div class="menu-item px-3">
          <a class="menu-link px-3" href="/admin/users/${row.id}">Details</a>
        </div>
        <div class="menu-item px-3">
          <a class="menu-link px-3 edit-user" href="#"
            data-id="${row.id}"
            data-name="${row.name || ''}"
            data-phone="${row.phone || ''}"
            data-address="${row.address || ''}"
            data-city="${row.city || ''}"
            data-state="${row.state || ''}"
            data-country="${row.country || ''}"
            data-postal-code="${row.postal_code || ''}">
            Edit
          </a>
        </div>
        <div class="menu-item px-3">
          <a class="menu-link px-3 text-danger delete-user" href="#" data-id="${row.id}">
            Delete
          </a>
        </div>
      </div>
    </div>`;
        },
    },
];

const tableSelector = '#users-table';
const url = '/admin/users';
let table;

$(document).ready(function () {
    table = $(tableSelector).DataTable({
        serverSide: true,
        processing: true,
        paging: true,
        lengthMenu: [10, 25, 50, 100],
        pageLength: 10,
        order: [[0, 'desc']],
        ajax: {
            url: `${url}/list`,
            type: 'GET',
            xhrFields: { withCredentials: true },
            data: function (d) {
                d.filters = filterOptions.filters;
                d.search.value = filterOptions.search;
            },
        },
        columns: userColumns,
<<<<<<< HEAD
        language: {
            processing: '<div class="d-flex align-items-center justify-content-center gap-3 py-2"><div class="spinner-border text-primary" style="width:1.75rem;height:1.75rem;border-width:3px;" role="status"><span class="visually-hidden">Loading...</span></div><span class="text-muted fs-7 fw-semibold">Loading...</span></div>',
        },
=======
>>>>>>> 95c69cb0528cc8bbd2f1eceea3cab1b82d5206c4
    });

    let searchTimer;
    $('#table-search').keyup(function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            const searchValue = this.value;
            filterOptions.search = searchValue;
            table.search(searchValue).draw();
        }, 500);
    });

    deleteUser();

<<<<<<< HEAD
=======
    // Select all checkbox
>>>>>>> 95c69cb0528cc8bbd2f1eceea3cab1b82d5206c4
    $(document).on('change', '#select-all-checkbox', function () {
        const isChecked = $(this).prop('checked');
        $('.row-checkbox').prop('checked', isChecked);
        updateBulkActionToolbar();
    });

<<<<<<< HEAD
=======
    // Individual checkbox
>>>>>>> 95c69cb0528cc8bbd2f1eceea3cab1b82d5206c4
    $(document).on('change', '.row-checkbox', function () {
        const allChecked = $('.row-checkbox:checked').length === $('.row-checkbox').length;
        $('#select-all-checkbox').prop('checked', allChecked);
        updateBulkActionToolbar();
    });

<<<<<<< HEAD
=======
    // Bulk delete
>>>>>>> 95c69cb0528cc8bbd2f1eceea3cab1b82d5206c4
    $(document).on('click', '[data-users-table-select="deactivate_selected"]', function () {
        const selectedIds = $('.row-checkbox:checked')
            .map(function () {
                return $(this).val();
            })
            .get();

        if (selectedIds.length === 0) return;

        SwalPopup.warning({
            confirmText: 'Yes!',
            text: 'Are you sure you want to delete selected users?',
        }).then(async function (result) {
            if (result.value) {
                await handleFormSubmission(
                    `${url}/bulk-delete`,
                    'POST',
                    { ids: selectedIds },
                    'Selected users deleted successfully.',
                    null,
                    null,
                );
                $('#select-all-checkbox').prop('checked', false);
                updateBulkActionToolbar();
            }
        });
    });

<<<<<<< HEAD
=======
    // Reinitialize dropdowns after table draw
>>>>>>> 95c69cb0528cc8bbd2f1eceea3cab1b82d5206c4
    table.on('draw', function () {
        $('#select-all-checkbox').prop('checked', false);
        updateBulkActionToolbar();
        const dropdownElements = document.querySelectorAll('[data-bs-toggle="dropdown"]');
        dropdownElements.forEach(function (element) {
            new bootstrap.Dropdown(element);
        });
    });

<<<<<<< HEAD
=======
    // Open edit modal — read all new fields
>>>>>>> 95c69cb0528cc8bbd2f1eceea3cab1b82d5206c4
    $(document).on('click', '.edit-user', function (e) {
        e.preventDefault();

        $('#edit-user-id').val($(this).data('id'));
        $('#edit-user-name').val($(this).data('name'));
        $('#edit-user-phone').val($(this).data('phone'));
        $('#edit-user-address').val($(this).data('address'));
        $('#edit-user-city').val($(this).data('city'));
        $('#edit-user-state').val($(this).data('state'));
        $('#edit-user-country').val($(this).data('country'));
        $('#edit-user-postal-code').val($(this).data('postal-code'));

        new bootstrap.Modal(document.getElementById('editUserModal')).show();
    });

<<<<<<< HEAD
=======
    // Save edit — send all new fields, no role
>>>>>>> 95c69cb0528cc8bbd2f1eceea3cab1b82d5206c4
    $(document).on('click', '#save-edit-user', async function () {
        const id = $('#edit-user-id').val();
        const name = $('#edit-user-name').val();
        const phone = $('#edit-user-phone').val();
        const address = $('#edit-user-address').val();
        const city = $('#edit-user-city').val();
        const state = $('#edit-user-state').val();
        const country = $('#edit-user-country').val();
        const postal_code = $('#edit-user-postal-code').val();

        if (!name) return SwalPopup.error('Name is required');
        if (!phone) return SwalPopup.error('Phone is required');
        if (!address) return SwalPopup.error('Address is required');
        if (!city) return SwalPopup.error('City is required');
        if (!state) return SwalPopup.error('State is required');
        if (!country) return SwalPopup.error('Country is required');
        if (!postal_code) return SwalPopup.error('Postal code is required');

        await handleFormSubmission(
            `/admin/users/${id}`,
            'PATCH',
            { name, phone, address, city, state, country, postal_code },
            'User updated successfully.',
            null,
            '#editUserModal',
        );
    });
});

function updateBulkActionToolbar() {
    const checkedCount = $('.row-checkbox:checked').length;
    const baseToolbar = $('[data-users-table-toolbar="base"]');
    const selectedToolbar = $('[data-users-table-toolbar="selected"]');
    const selectedCount = $('[data-users-table-select="selected_count"]');

    if (checkedCount > 0) {
        baseToolbar.addClass('d-none');
        selectedToolbar.removeClass('d-none');
        selectedCount.text(checkedCount);
    } else {
        baseToolbar.removeClass('d-none');
        selectedToolbar.addClass('d-none');
    }
}

async function handleFormSubmission(
    url,
    method,
    data,
    successMessage,
    formSelector,
    modalSelector,
) {
    const response = await request(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    $(modalSelector).modal('hide');
    if (response.success) {
        SwalPopup.success(response.message || successMessage);
        table.ajax.reload();
        if ($(formSelector)?.[0]) {
            $(formSelector)[0].reset();
        }
        $(modalSelector).modal('hide');
    } else {
        await SwalPopup.error(response.message || 'Something went wrong').then(function () {
            $(modalSelector).modal('show');
        });
    }
}

function deleteUser() {
    $(tableSelector).on('click', '.delete-user', function (e) {
        e.preventDefault();
        const rowIDToBeDelete = $(this).attr('data-id');
        SwalPopup.warning({
            confirmText: 'Yes, delete it!',
        }).then(async function (result) {
            if (result.value) {
                await handleFormSubmission(
                    `${url}/${rowIDToBeDelete}`,
                    'DELETE',
                    {},
                    'User deleted successfully.',
                    null,
                    null,
                );
            }
        });
    });
<<<<<<< HEAD
}
=======
}
>>>>>>> 95c69cb0528cc8bbd2f1eceea3cab1b82d5206c4
