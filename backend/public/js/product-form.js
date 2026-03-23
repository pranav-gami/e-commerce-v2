const productUrl = "/admin/products";
const isEdit = $("#product-id").length > 0;
const id = $("#product-id").val();
let selectedImageFiles = [];

$(document).ready(function () {
  // ── Gallery image selection ──────────────────────────────
  $("#product-images").on("change", function () {
    const newFiles = Array.from(this.files);

    newFiles.forEach((newFile) => {
      const exists = selectedImageFiles.find((f) => f.name === newFile.name);
      if (!exists) selectedImageFiles.push(newFile);
    });

    if (selectedImageFiles.length > 5) {
      selectedImageFiles = selectedImageFiles.slice(0, 5);
      SwalPopup.error("Maximum 5 images allowed. Only first 5 kept.");
    }

    renderImagePreviews();
    $(this).val("");
  });

  // ── Remove individual image from preview ─────────────────
  $(document).on("click", ".remove-image", function () {
    const index = parseInt($(this).data("index"));
    selectedImageFiles.splice(index, 1);
    renderImagePreviews();
  });

  // ── Save product ─────────────────────────────────────────
  $("#save-product").on("click", async function () {
    const name = $("#product-name").val().trim();
    const description = $("#product-description").val().trim();
    const price = $("#product-price").val().trim();
    const discount = $("#product-discount").val().trim();
    const stock = $("#product-stock").val().trim();
    const subCategoryId = $("#product-subCategoryId").val();
    const status = $("#product-status").val();
    const isFeatured = $("#product-isFeatured").is(":checked");
    const imageFile = $("#product-image")[0].files[0];

    // ── Validation ───────────────────────────────────────────
    if (!name) return SwalPopup.error("Product name is required");
    if (!price || parseFloat(price) <= 0)
      return SwalPopup.error("Price must be greater than 0");
    if (stock === "" || parseInt(stock) < 0)
      return SwalPopup.error("Stock cannot be negative");
    if (!subCategoryId) return SwalPopup.error("Please select a sub category");
    if (
      discount !== "" &&
      (parseFloat(discount) < 0 || parseFloat(discount) > 100)
    )
      return SwalPopup.error("Discount must be between 0 and 100");

    // ── Build FormData ───────────────────────────────────────
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("discount", discount || "0");
    formData.append("stock", stock);
    formData.append("subCategoryId", subCategoryId);
    formData.append("status", status);
    formData.append("isFeatured", isFeatured);

    if (imageFile) formData.append("image", imageFile);

    selectedImageFiles.forEach((file) => {
      formData.append("images", file);
    });

    // ── Loading state ────────────────────────────────────────
    const btn = $(this);
    btn.attr("data-kt-indicator", "on");
    btn.prop("disabled", true);

    try {
      const url = isEdit ? `${productUrl}/${id}` : productUrl;
      const method = isEdit ? "PUT" : "POST";

      // ✅ FIXED: added credentials: "include" so cookie is sent with request
      const res = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        SwalPopup.success(
          isEdit
            ? "Product updated successfully"
            : "Product created successfully",
        ).then(() => {
          window.location.href = "/admin/products";
        });
      } else {
        SwalPopup.error(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Save product error:", err);
      SwalPopup.error("Something went wrong. Please try again.");
    } finally {
      btn.removeAttr("data-kt-indicator");
      btn.prop("disabled", false);
    }
  });
});

// ── Render image previews ────────────────────────────────────
function renderImagePreviews() {
  const container = $("#images-preview");
  const countEl = $("#images-count");
  container.empty();

  selectedImageFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      container.append(`
        <div class="position-relative" id="img-preview-${index}">
          <img src="${e.target.result}" class="rounded"
            style="width:80px;height:80px;object-fit:cover;" />
          <button type="button"
            class="btn btn-icon btn-sm btn-danger position-absolute top-0 end-0 remove-image"
            style="width:20px;height:20px;padding:0;font-size:10px;"
            data-index="${index}">
            ✕
          </button>
        </div>
      `);
    };
    reader.readAsDataURL(file);
  });

  countEl.text(
    selectedImageFiles.length > 0
      ? `${selectedImageFiles.length} image(s) selected`
      : "",
  );
}
