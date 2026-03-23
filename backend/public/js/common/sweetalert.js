const SwalPopup = {
    // Success popups
    success: (message, timer = 3000) => {
        return Swal.fire({
            text: message,
            icon: 'success',
            timer: timer,
            buttonsStyling: false,
            confirmButtonText: 'Ok, got it!',
            customClass: {
                confirmButton: 'btn btn-primary',
            },
        });
    },

    // Warning popups with confirmation
    warning: ({
        title = 'Are you sure?',
        text = "You won't be able to revert this!",
        confirmText = 'Yes, cancel!',
        cancelText = 'No, cancel!',
    } = {}) => {
        return Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn btn-light',
            },
        });
    },

    // Error popups
    error: (message = 'Something went wrong') => {
        return Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: message,
            buttonsStyling: false,
            confirmButtonText: 'Ok, got it!',
            customClass: {
                confirmButton: 'btn btn-primary',
            },
        });
    },

    // Custom popup with options
    custom: options => {
        const defaultOptions = {
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn btn-active-light',
            },
        };
        return Swal.fire({
            ...defaultOptions,
            ...options,
        });
    },
};

// Prevent modification of the SwalPopup object
Object.freeze(SwalPopup);
