const categoryUrl = "/admin/categories";

$(document).ready(function () {
  const isEdit = $("#category-id").length > 0;
  const id = $("#category-id").val();

  $("#save-category").on("click", async function () {
    const name = $("#category-name").val().trim();
    const description = $("#category-description").val().trim();
    const imageFile = $("#category-image")[0].files[0];

    if (!name) return SwalPopup.error("Name is required");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (imageFile) formData.append("image", imageFile);

    const btn = $(this);
    btn.attr("data-kt-indicator", "on");
    btn.prop("disabled", true);

    try {
      const url = isEdit ? `${categoryUrl}/${id}` : categoryUrl;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData, // no Content-Type header — browser sets it with boundary
      });

      const data = await res.json();

      if (data.success) {
        SwalPopup.success(
          isEdit
            ? "Category updated successfully"
            : "Category created successfully",
        ).then(() => {
          window.location.href = "/admin/categories";
        });
      } else {
        SwalPopup.error(data.message || "Something went wrong");
      }
    } catch (err) {
      SwalPopup.error("Something went wrong");
    } finally {
      btn.removeAttr("data-kt-indicator");
      btn.prop("disabled", false);
    }
  });
});
