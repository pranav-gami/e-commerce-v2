$(document).ready(function () {
    const formSelector = '#kt_app_version_form';
    const submitButton = $('#kt_app_version_submit');
    const form = $(formSelector).parsley();

    const path = window.location.pathname;
    const deviceId = path.split('/app-version/update/')[1] ?? null;

    // === Custom validation for checkboxes ===
    function validateFlags() {
        const checkboxes = $(
            "input[name='is_force_update'], input[name='is_maintenance'], input[name='is_partial_update']",
        );
        let oneChecked = false;
        checkboxes.each(function () {
            if ($(this).is(':checked')) {
                oneChecked = true;
            }
        });

        if (!oneChecked) {
            $('#flag-error').show();
            return false;
        } else {
            $('#flag-error').hide();
            return true;
        }
    }

    // Handle form submission
    $(formSelector).on('submit', async function (e) {
        e.preventDefault();
        if (!form.isValid()) return;
        if (!validateFlags()) return;

        const formData = {
            id: deviceId,
            name: $('[name="name"]').val().trim(),
            version: $('[name="version"]').val().trim(),
            is_force_update: $('[name="is_force_update"]').is(':checked'),
            is_maintenance: $('[name="is_maintenance"]').is(':checked'),
            is_partial_update: $('[name="is_partial_update"]').is(':checked'),
        };

        submitButton.attr('data-kt-indicator', 'on');
        submitButton.prop('disabled', true);

        try {
            const url = `/app-version/update/${deviceId}`;
            const method = 'PATCH';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                window.location.href = '/app-version';
            } else {
                Swal.fire('Error', result.message || 'Operation failed', 'error');
            }
        } catch (err) {
            Swal.fire('Error', err.message || 'Failed to process your request', 'error');
        } finally {
            submitButton.removeAttr('data-kt-indicator');
            submitButton.prop('disabled', false);
        }
    });

    if (deviceId) {
        fetchAndFillAppVersionDetails(deviceId);
    }
});
