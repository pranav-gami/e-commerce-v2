$(document).ready(function () {
  // Save profile
  $(document).on("click", "#save-profile", async function () {
    const name = $("#admin-name").val().trim();

    if (!name) {
      SwalPopup.error("Name is required");
      return;
    }

    const btn = $(this);
    btn.attr("data-kt-indicator", "on");
    btn.prop("disabled", true);

    try {
      const response = await request("/profile/edit", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (response.success) {
        SwalPopup.success(
          response.message || "Profile updated successfully",
        ).then(() => {
          window.location.href = "/profile";
        });
      } else {
        SwalPopup.error(response.message || "Something went wrong");
      }
    } catch (error) {
      SwalPopup.error("Something went wrong");
    } finally {
      btn.removeAttr("data-kt-indicator");
      btn.prop("disabled", false);
    }
  });

  // Save password
  $(document).on("click", "#save-password", async function () {
    const oldPassword = $("#old-password").val().trim();
    const newPassword = $("#new-password").val().trim();
    const confirmPassword = $("#confirm-password").val().trim();

    if (!oldPassword) {
      SwalPopup.error("Current password is required");
      return;
    }
    if (!newPassword) {
      SwalPopup.error("New password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      SwalPopup.error("Passwords do not match");
      return;
    }

    const btn = $(this);
    btn.attr("data-kt-indicator", "on");
    btn.prop("disabled", true);

    try {
      const response = await request("/profile/change-password", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (response.success) {
        SwalPopup.success(
          response.message || "Password changed successfully",
        ).then(() => {
          window.location.href = "/profile";
        });
      } else {
        SwalPopup.error(response.message || "Something went wrong");
      }
    } catch (error) {
      SwalPopup.error("Something went wrong");
    } finally {
      btn.removeAttr("data-kt-indicator");
      btn.prop("disabled", false);
    }
  });
});
