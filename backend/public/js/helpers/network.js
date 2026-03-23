async function request(url, options) {
  console.log("url in network---", url);
  return new Promise((resolve, reject) => {
    fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
      },
    })
      .then((response) => {
        if (response.status >= 200 && response.status < 300) {
          const res = response.json();
          // successTost(res);
          return res;
        } else {
          return response.json().then((err) => {
            throw err;
          });
        }
      })
      .then((data) => resolve(data))
      .catch((err) => {
        errorTost(err);
        resolve(err);
      });
  });
}

function successTost(response) {
  toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: "toastr-top-right",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "500",
    timeOut: "1000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };

  toastr.success("Success", response.message);
}

function errorTost(error) {
  toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: "toastr-top-right",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "500",
    timeOut: "1000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };
  const errors = error.errors || [error.message] || ["Something went wrong"];
  errors.forEach((err) => toastr.error("Error", err));
}
