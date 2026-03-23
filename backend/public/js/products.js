const productUrl = "/admin/products";
let productTable;
let allProducts = [];

$(document).ready(function () {
  productTable = $("#products-table").DataTable({
    serverSide: false,
    processing: true,
    ajax: {
      url: productUrl,
      type: "GET",
      headers: { Accept: "application/json" },
      xhrFields: { withCredentials: true },
      dataSrc: function (json) {
        allProducts = json.data || [];
        return allProducts;
      },
      cache: true,
    },
    columns: [
      {
        data: "id",
        orderable: false,
        searchable: false,
        width: "5%",
        render: function (data) {
          return `<input type="checkbox" class="form-check-input product-row-checkbox" value="${data}">`;
        },
      },
      {
        data: "image",
        title: "Image",
        orderable: false,
        searchable: false,
        render: function (data, type, row) {
          return data
            ? `<img src="${data}" alt="${row.name}" style="width:50px;height:50px;object-fit:cover;" class="rounded" />`
            : `<div class="symbol symbol-50px">
                <div class="symbol-label bg-light-primary text-primary fw-bold fs-4">
                  ${row.name?.charAt(0).toUpperCase() || "?"}
                </div>
              </div>`;
        },
      },
      {
        data: "name",
        title: "Name",
        orderable: true,
        searchable: true,
        render: function (data, type, row) {
          return `<div>
            <span class="text-gray-800 fw-bold d-block">${data || ""}</span>
            <span class="text-muted fs-7">${row.subCategory?.name || ""}</span>
          </div>`;
        },
      },
      {
        data: "price",
        title: "Price",
        orderable: true,
        render: function (data, type, row) {
          const discounted =
            row.discount > 0
              ? `<br><span class="text-success fs-7">-${row.discount}% off</span>`
              : "";
          return `<span class="fw-semibold">₹${parseFloat(data).toFixed(2)}</span>${discounted}`;
        },
      },
      {
        data: null,
        title: "Selling Price",
        orderable: true,
        render: function (data, type, row) {
          const price = parseFloat(row.price) || 0;
          const discount = parseFloat(row.discount) || 0;
          const sellingPrice = price - (price * discount) / 100;
          return `<span class="fw-bold text-primary">₹${sellingPrice.toFixed(2)}</span>`;
        },
      },
      {
        data: "stock",
        title: "Stock",
        orderable: true,
        render: function (data) {
          const cls =
            data === 0
              ? "badge-light-danger"
              : data < 10
                ? "badge-light-warning"
                : "badge-light-success";
          return `<span class="badge ${cls}">${data}</span>`;
        },
      },
      {
        data: "subCategory",
        title: "Category",
        orderable: false,
        render: function (data) {
          return data?.category?.name
            ? `<span class="badge badge-light-info">${data.category.name}</span>`
            : "-";
        },
      },
      {
        data: "status",
        title: "Status",
        orderable: true,
        render: function (data, type, row) {
          const isActive = data === "ACTIVE";
          return `<span class="badge ${isActive ? "badge-light-success" : "badge-light-danger"} cursor-pointer toggle-status"
            data-id="${row.id}" data-status="${data}">
            ${data}
          </span>`;
        },
      },
      {
        data: "isFeatured",
        title: "Featured",
        orderable: false,
        render: function (data, type, row) {
          return `<span class="badge ${data ? "badge-light-warning" : "badge-light-secondary"} cursor-pointer toggle-featured"
            data-id="${row.id}" data-featured="${data}">
            ${data ? "⭐ Yes" : "No"}
          </span>`;
        },
      },
      {
        data: "createdAt",
        title: "Created At",
        orderable: true,
        render: function (data) {
          return new Date(data).toLocaleDateString();
        },
      },
      {
        data: null,
        title: "Actions",
        orderable: false,
        width: "10%",
        render: function (data, type, row) {
          return `
            <div class="dropdown">
              <button class="btn btn-light btn-active-light-primary btn-sm dropdown-toggle"
                type="button" data-bs-toggle="dropdown">
                Actions
              </button>
              <div class="dropdown-menu menu menu-sub menu-sub-dropdown menu-column menu-rounded
                menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-125px py-4">
                <div class="menu-item px-3">
                  <a class="menu-link px-3" href="/admin/products/${row.id}/edit">Edit</a>
                </div>
                <div class="menu-item px-3">
                  <a class="menu-link px-3 text-danger delete-product" href="#"
                    data-id="${row.id}" data-name="${row.name}">
                    Delete
                  </a>
                </div>
              </div>
            </div>`;
        },
      },
    ],
    order: [[0, "desc"]],
  });

  // ── Reinit dropdowns after draw ──────────────────────────
  productTable.on("draw", function () {
    $("#product-select-all").prop("checked", false);
    updateProductBulkToolbar();
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((el) => {
      new bootstrap.Dropdown(el);
    });
  });

  // ── Search ───────────────────────────────────────────────
  let searchTimer;
  $("#product-table-search").keyup(function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      productTable.search(this.value).draw();
    }, 500);
  });

  // ── Filters ──────────────────────────────────────────────
  $("#product-filter-category").on("change", applyFilters);
  $("#product-filter-status").on("change", applyFilters);
  $("#product-filter-featured").on("change", applyFilters);

  // ── Reset filters ────────────────────────────────────────
  $("#product-reset-filter").on("click", function () {
    $("#product-filter-category").val("");
    $("#product-filter-status").val("");
    $("#product-filter-featured").val("");
    $("#product-table-search").val("");
    $.fn.dataTable.ext.search = []; // clear any leftover filters
    productTable.search("").ajax.reload();
  });

  // ── Select all ───────────────────────────────────────────
  $(document).on("change", "#product-select-all", function () {
    $(".product-row-checkbox").prop("checked", $(this).prop("checked"));
    updateProductBulkToolbar();
  });

  // ── Individual checkbox ──────────────────────────────────
  $(document).on("change", ".product-row-checkbox", function () {
    const allChecked =
      $(".product-row-checkbox:checked").length ===
      $(".product-row-checkbox").length;
    $("#product-select-all").prop("checked", allChecked);
    updateProductBulkToolbar();
  });

  // ── Bulk delete ──────────────────────────────────────────
  $(document).on(
    "click",
    '[data-product-table-select="delete_selected"]',
    function () {
      const selectedIds = $(".product-row-checkbox:checked")
        .map(function () {
          return $(this).val();
        })
        .get();

      if (selectedIds.length === 0) return;

      SwalPopup.warning({
        confirmText: "Yes, delete!",
        text: "Are you sure you want to delete selected products?",
      }).then(async function (result) {
        if (result.value) {
          const res = await request(`${productUrl}/bulk-delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ ids: selectedIds }),
          });
          if (res.success) {
            SwalPopup.success("Selected products deleted successfully");
            productTable.ajax.reload();
          } else {
            SwalPopup.error(res.message || "Something went wrong");
          }
          $("#product-select-all").prop("checked", false);
          updateProductBulkToolbar();
        }
      });
    },
  );

  // ── Delete single ────────────────────────────────────────
  $(document).on("click", ".delete-product", function (e) {
    e.preventDefault();
    const id = $(this).data("id");
    const name = $(this).data("name");

    SwalPopup.warning({
      text: `Are you sure you want to delete "${name}"?`,
      confirmText: "Yes, delete it!",
    }).then(async function (result) {
      if (result.value) {
        try {
          const res = await request(`${productUrl}/${id}`, {
            method: "DELETE",
          });
          if (res.success) {
            SwalPopup.success(res.message || "Product deleted successfully");
            productTable.ajax.reload();
          } else {
            SwalPopup.error(res.message || "Something went wrong");
          }
        } catch (err) {
          SwalPopup.error("Something went wrong");
        }
      }
    });
  });

  // ── Toggle Status ────────────────────────────────────────
  $(document).on("click", ".toggle-status", async function () {
    const id = $(this).data("id");
    const current = $(this).data("status");
    const newStatus = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const res = await request(`${productUrl}/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        productTable.ajax.reload(null, false);
      } else {
        SwalPopup.error(res.message || "Failed to update status");
      }
    } catch (err) {
      SwalPopup.error("Something went wrong");
    }
  });

  // ── Toggle Featured ──────────────────────────────────────
  $(document).on("click", ".toggle-featured", async function () {
    const id = $(this).data("id");

    try {
      const res = await request(`${productUrl}/${id}/featured`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });
      if (res.success) {
        productTable.ajax.reload(null, false);
      } else {
        SwalPopup.error(res.message || "Failed to toggle featured");
      }
    } catch (err) {
      SwalPopup.error("Something went wrong");
    }
  });
});

// ── Client-side filter ───────────────────────────────────
function applyFilters() {
  const categoryId = $("#product-filter-category").val();
  const status = $("#product-filter-status").val();
  const featured = $("#product-filter-featured").val();

  // clear previous custom filters
  $.fn.dataTable.ext.search = [];

  $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
    if (settings.nTable.id !== "products-table") return true;
    const row = productTable.row(dataIndex).data();

    // filter by category id
    if (
      categoryId &&
      String(row.subCategory?.category?.id) !== String(categoryId)
    )
      return false;

    // filter by status
    if (status && row.status !== status) return false;

    // filter by featured
    if (featured !== "" && String(row.isFeatured) !== featured) return false;

    return true;
  });

  productTable.draw();
}

// ── Bulk toolbar visibility ──────────────────────────────
function updateProductBulkToolbar() {
  const checkedCount = $(".product-row-checkbox:checked").length;
  const baseToolbar = $('[data-product-table-toolbar="base"]');
  const selectedToolbar = $('[data-product-table-toolbar="selected"]');
  const selectedCount = $('[data-product-table-select="selected_count"]');

  if (checkedCount > 0) {
    baseToolbar.addClass("d-none");
    selectedToolbar.removeClass("d-none").addClass("d-flex");
    selectedCount.text(checkedCount);
  } else {
    baseToolbar.removeClass("d-none");
    selectedToolbar.addClass("d-none").removeClass("d-flex");
  }
}