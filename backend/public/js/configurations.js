var KTConfigurations = (function () {
    const modal = document.getElementById('kt_modal_add_configuration'),
        form = document.getElementById('kt_modal_add_configuration_form'),
        modalInstance = new bootstrap.Modal(modal);

    let currentId = null;

    const populateForm = data => {
        // Clear existing fields
        document.getElementById('fields-container').innerHTML = '';

        document.getElementById('config-name-input').value = data.name;

        data.fields.forEach((field, index) => {
            addField(field, index);
        });
    };

    const addField = (field = {}, index = null) => {
        const container = document.getElementById('fields-container');
        const fieldIndex = index !== null ? index : container.children.length;

        // Decide how to render value input
        let valueInputHtml = `
        <input type="text" 
            name="fields[${fieldIndex}][value]" 
            class="form-control form-control-solid"
            placeholder="Field Value" 
            required 
            value="${field.value || ''}" />`;

        if (field.input_type === 'boolean') {
            valueInputHtml = `
            <select name="fields[${fieldIndex}][value]" class="form-select form-select-solid" required>
                <option value="true" ${field.value === 'true' ? 'selected' : ''}>True</option>
                <option value="false" ${field.value === 'false' ? 'selected' : ''}>False</option>
            </select>`;
        }

        const fieldHtml = `
    <div class="row mb-2 align-items-center">
        ${field.id ? `<input type="hidden" name="fields[${fieldIndex}][id]" value="${field.id}">` : ''}
        
        <div class="col-md-4">
            <input type="text" 
                name="fields[${fieldIndex}][name]" 
                class="form-control form-control-solid"
                placeholder="Field Name" 
                required 
                value="${field.name || ''}" />
        </div>

        <div class="col-md-4 value-col">
            ${valueInputHtml}
        </div>

        <div class="col-md-3">
            <select name="fields[${fieldIndex}][input_type]" class="form-select form-select-solid input-type-select">
                <option value="string" ${field.input_type === 'string' ? 'selected' : ''}>String</option>
                <option value="number" ${field.input_type === 'number' ? 'selected' : ''}>Number</option>
                <option value="date" ${field.input_type === 'date' ? 'selected' : ''}>Date</option>
                <option value="boolean" ${field.input_type === 'boolean' ? 'selected' : ''}>Boolean</option>
            </select>
        </div>

        <div class="col-md-1 text-end">
            ${
                field.is_deletable || !Object.hasOwnProperty.call(field, 'is_deletable')
                    ? `
                <button type="button" class="btn btn-icon btn-danger remove-field-btn">
                    <i class="bi bi-x"></i>
                </button>
            `
                    : ''
            }
        </div>
    </div>`;

        container.insertAdjacentHTML('beforeend', fieldHtml);
    };

    // Listen for type changes (string, number, date, boolean)
    document.addEventListener('change', function (event) {
        if (event.target.classList.contains('input-type-select')) {
            const row = event.target.closest('.row');
            const valueCol = row.querySelector('.value-col');
            const fieldIndex = Array.from(row.parentNode.children).indexOf(row);

            // Capture old value (from input or select)
            let currentValue = '';
            const existingInput = valueCol.querySelector('input, select');
            if (existingInput) currentValue = existingInput.value;

            let newValueHtml;

            if (event.target.value === 'boolean') {
                newValueHtml = `
                <select name="fields[${fieldIndex}][value]" class="form-select form-select-solid" required>
                    <option value="true" ${currentValue === 'true' ? 'selected' : ''}>True</option>
                    <option value="false" ${currentValue === 'false' ? 'selected' : ''}>False</option>
                </select>`;
            } else {
                newValueHtml = `
                <input type="text" 
                    name="fields[${fieldIndex}][value]" 
                    class="form-control form-control-solid"
                    placeholder="Field Value" required 
                    value="${currentValue || ''}" />`;
            }

            valueCol.innerHTML = newValueHtml;
        }
    });

    document.getElementById('add-field-btn').addEventListener('click', function () {
        addField();
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('.remove-field-btn')) {
            event.target.closest('.row').remove();
        }
    });

    const handleEditRow = () => {
        const editButtons = document.querySelectorAll(
            "[data-kt-configurations-table-filter='edit_row']",
        );
        editButtons.forEach(button => {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                const row = button;
                currentId = row.getAttribute('config-id');

                const data = JSON.parse(row.getAttribute('data-fields'));

                modal.querySelector('.modal-title').textContent = 'Edit Configuration';
                populateForm(data);

                modalInstance.show();
            });
        });
    };

    const handleDeleteRow = () => {
        const deleteButtons = document.querySelectorAll(
            "[data-kt-configurations-table-filter='delete_row']",
        );
        deleteButtons.forEach(button => {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                const row = button;
                const id = row.getAttribute('config-id');

                Swal.fire({
                    text: 'Are you sure you want to delete this configuration?',
                    icon: 'warning',
                    showCancelButton: true,
                    buttonsStyling: false,
                    confirmButtonText: 'Yes, delete it!',
                    cancelButtonText: 'No, cancel',
                    customClass: {
                        confirmButton: 'btn btn-primary',
                        cancelButton: 'btn btn-active-light',
                    },
                }).then(result => {
                    if (result.value) {
                        fetch(`/configurations/${id}`, { method: 'DELETE' })
                            .then(response => response.json())
                            .then(data => {
                                Swal.fire({
                                    text: data.message || 'Configuration deleted successfully!',
                                    icon: 'success',
                                    timer: 3000,
                                    buttonsStyling: false,
                                    confirmButtonText: 'Ok, got it!',
                                    customClass: { confirmButton: 'btn btn-primary' },
                                }).then(() => {
                                    window.location.reload();
                                });
                            })
                            .catch(error => {
                                Swal.fire({
                                    text: `An error occurred: ${error.message}`,
                                    icon: 'error',
                                    buttonsStyling: false,
                                    confirmButtonText: 'Ok, got it!',
                                    customClass: { confirmButton: 'btn btn-primary' },
                                });
                            });
                    }
                });
            });
        });
    };

    return {
        init: function () {
            (() => {
                var validator = FormValidation.formValidation(form, {
                    fields: {
                        name: {
                            validators: { notEmpty: { message: 'Configuration Name is required' } },
                        },
                        'fields[0][name]': {
                            validators: { notEmpty: { message: 'Field Name is required' } },
                        },
                        'fields[0][value]': {
                            validators: { notEmpty: { message: 'Field Value is required' } },
                        },
                    },
                    plugins: {
                        trigger: new FormValidation.plugins.Trigger(),
                        bootstrap: new FormValidation.plugins.Bootstrap5({
                            rowSelector: '.fv-row',
                            eleInvalidClass: '',
                            eleValidClass: '',
                        }),
                    },
                });

                const submitButton = modal.querySelector(
                    "[data-kt-configurations-modal-action='submit']",
                );
                submitButton.addEventListener('click', e => {
                    e.preventDefault();
                    validator &&
                        validator.validate().then(status => {
                            if (status === 'Valid') {
                                submitButton.setAttribute('data-kt-indicator', 'on');
                                submitButton.disabled = true;

                                const formData = new FormData(form);
                                const jsonData = { fields: [] };

                                formData.forEach((value, key) => {
                                    if (key.startsWith('fields[')) {
                                        const match = key.match(/\[(\d+)]\[(.+)]/);
                                        if (match) {
                                            const index = match[1];
                                            const property = match[2];

                                            if (!jsonData.fields[index])
                                                jsonData.fields[index] = {};
                                            jsonData.fields[index][property] = value;
                                        }
                                    } else {
                                        jsonData[key] = value;
                                    }
                                });

                                const url = currentId
                                    ? `/configurations/${currentId}`
                                    : '/configurations';
                                const method = currentId ? 'PUT' : 'POST';

                                fetch(url, {
                                    method,
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(jsonData),
                                })
                                    .then(response => response.json())
                                    .then(data => {
                                        submitButton.removeAttribute('data-kt-indicator');
                                        submitButton.disabled = false;

                                        Swal.fire({
                                            text: data.message || 'Operation successful!',
                                            icon: 'success',
                                            timer: 3000,
                                            buttonsStyling: false,
                                            confirmButtonText: 'Ok, got it!',
                                            customClass: { confirmButton: 'btn btn-primary' },
                                        }).then(() => {
                                            modalInstance.hide();
                                            window.location.reload();
                                        });
                                    })
                                    .catch(error => {
                                        submitButton.removeAttribute('data-kt-indicator');
                                        submitButton.disabled = false;
                                        Swal.fire({
                                            text: `An error occurred: ${error.message}`,
                                            icon: 'error',
                                            buttonsStyling: false,
                                            confirmButtonText: 'Ok, got it!',
                                            customClass: { confirmButton: 'btn btn-primary' },
                                        });
                                    });
                            }
                        });
                });

                const handleModalClose = () => {
                    form.reset();
                    currentId = null;
                    modal.querySelector('.modal-title').textContent = 'Add Configuration';
                    document.getElementById('fields-container').innerHTML = '';
                };

                modal.addEventListener('hidden.bs.modal', handleModalClose);

                ['cancel', 'close'].forEach(action => {
                    modal
                        .querySelector(`[data-kt-configurations-modal-action='${action}']`)
                        .addEventListener('click', event => {
                            event.preventDefault();
                            Swal.fire({
                                title: 'Are you sure?',
                                text: "You won't be able to revert this!",
                                icon: 'warning',
                                showCancelButton: true,
                                buttonsStyling: false,
                                confirmButtonText: 'Yes, cancel it!',
                                cancelButtonText: 'No, cancel!',
                                customClass: {
                                    confirmButton: 'btn btn-primary',
                                    cancelButton: 'btn btn-active-light',
                                },
                            }).then(result => {
                                if (result.value) {
                                    handleModalClose();
                                    modalInstance.hide();
                                }
                            });
                        });
                });

                handleEditRow();
                handleDeleteRow();
            })();
        },
    };
})();

// Initialize only what's needed
KTUtil.onDOMContentLoaded(function () {
    KTConfigurations.init();
});
