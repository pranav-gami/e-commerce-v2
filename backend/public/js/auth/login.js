"use strict";
var KTSigninGeneral = (function () {
  var e, t, i;
  return {
    init: function () {
      const toggle = document.getElementById("togglePassword");
      const passwordInput = document.getElementById("passwordInput");

      toggle.addEventListener("click", function () {
        const type =
          passwordInput.getAttribute("type") === "password"
            ? "text"
            : "password";
        passwordInput.setAttribute("type", type);

        // Toggle eye / eye-slash icon
        const icon = toggle.querySelector("i");
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
      });
      ((e = document.querySelector("#kt_sign_in_form")),
        (t = document.querySelector("#kt_sign_in_submit")),
        (i = FormValidation.formValidation(e, {
          fields: {
            email: {
              validators: {
                regexp: {
                  regexp: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "The value is not a valid email address",
                },
                notEmpty: { message: "Email address is required" },
              },
            },
            password: {
              validators: { notEmpty: { message: "The password is required" } },
            },
          },
          plugins: {
            trigger: new FormValidation.plugins.Trigger(),
            bootstrap: new FormValidation.plugins.Bootstrap5({
              rowSelector: ".fv-row",
              eleInvalidClass: "",
              eleValidClass: "",
            }),
          },
        })),
        t.addEventListener("click", async function (n) {
          (n.preventDefault(),
            i.validate().then(async function (i) {
              if ("Valid" == i) {
                t.setAttribute("data-kt-indicator", "on");
                t.disabled = !0;

                const email = e.querySelector('[name="email"]').value;
                const password = e.querySelector('[name="password"]').value;

                try {
                  const response = await fetch("/admin/auth/login", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                  });

                  const data = await response.json();

                  if (response.ok) {
                    t.removeAttribute("data-kt-indicator");
                    t.disabled = !1;
                    Swal.fire({
                      text: "You have successfully logged in!",
                      icon: "success",
                      buttonsStyling: false,
                      timer: 3000,
                      confirmButtonText: "Ok, got it!",
                      customClass: {
                        confirmButton: "btn btn-primary",
                      },
                    }).then(function (t) {
                      e.querySelector('[name="email"]').value = "";
                      e.querySelector('[name="password"]').value = "";
                      var i = e.getAttribute("data-kt-redirect-url");
                      i && (location.href = i);
                    });
                  } else {
                    throw new Error(data.message || "Login failed!");
                  }
                } catch (error) {
                  t.removeAttribute("data-kt-indicator");
                  t.disabled = !1;
                  Swal.fire({
                    text:
                      error.message ||
                      "Something went wrong. Please try again.",
                    icon: "error",
                    buttonsStyling: !1,
                    confirmButtonText: "Ok, got it!",
                    customClass: { confirmButton: "btn btn-primary" },
                  });
                }
              } else {
                Swal.fire({
                  text: "Sorry, looks like there are some errors detected, please try again.",
                  icon: "error",
                  buttonsStyling: !1,
                  confirmButtonText: "Ok, got it!",
                  customClass: { confirmButton: "btn btn-primary" },
                });
              }
            }));
        }));
    },
  };
})();
KTUtil.onDOMContentLoaded(function () {
  KTSigninGeneral.init();
});
