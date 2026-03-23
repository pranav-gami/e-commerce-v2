const filterOptions = { search: "", filters: {} };
const categoryUrl = "/admin/categories";
let categoryTable;

$(document).ready(function () {
  categoryTable = $("#categories-table").DataTable({
    serverSide: false,
    processing: true,
    ajax: {
      url: categoryUrl,
      type: "GET",
      headers: { Accept: "application/json" },
      xhrFields: { withCredentials: true },
      dataSrc: "data",
      cache: true,
    },
    columns: [
      {
        data: null,
        orderable: false,
        searchable: false,
        width: "3%",
        render: function () {
          return "";
        },
      },
      {
        data: "id",
        orderable: false,
        searchable: false,
        width: "5%",
        render: function (data) {
          return `<input type="checkbox" class="form-check-input cat-row-checkbox" value="${data}">`;
        },
      },
      {
        data: "image",
        title: "Image",
        orderable: false,
        searchable: false,
        render: function (data, type, row) {
          return data
            ? `<img src="${data}" alt="${row.name}" style="width:45px;height:45px;object-fit:cover;" class="rounded" />`
            : `<div class="symbol symbol-45px">
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
        render: function (data) {
          return `<span class="text-gray-800 fw-semibold">${data || ""}</span>`;
        },
      },
      {
        data: "slug",
        title: "Slug",
        orderable: false,
        render: function (data) {
          return `<span class="badge badge-light-dark">${data || ""}</span>`;
        },
      },
      {
        data: "subCategories",
        title: "Sub Categories",
        orderable: false,
        render: function (data) {
          return `<span class="badge badge-light-primary">${data?.length || 0} subs</span>`;
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
        width: "15%",
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
                  <a class="menu-link px-3" href="/admin/categories/${row.id}/edit">Edit</a>
                </div>
                <div class="menu-item px-3">
                  <a class="menu-link px-3 text-danger delete-category" href="#"
                    data-id="${row.id}"
                    data-name="${row.name}">
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

  // ── Reinit dropdowns after draw ─────────────────────────
  categoryTable.on("draw", function () {
    $("#cat-select-all").prop("checked", false);
    updateCatBulkToolbar();
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((el) => {
      new bootstrap.Dropdown(el);
    });
  });

  // ── Search ───────────────────────────────────────────────
  let searchTimer;
  $("#cat-table-search").keyup(function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      categoryTable.search(this.value).draw();
    }, 500);
  });

  // ── Select all ───────────────────────────────────────────
  $(document).on("change", "#cat-select-all", function () {
    $(".cat-row-checkbox").prop("checked", $(this).prop("checked"));
    updateCatBulkToolbar();
  });

  // ── Individual checkbox ──────────────────────────────────
  $(document).on("change", ".cat-row-checkbox", function () {
    const allChecked =
      $(".cat-row-checkbox:checked").length === $(".cat-row-checkbox").length;
    $("#cat-select-all").prop("checked", allChecked);
    updateCatBulkToolbar();
  });

  // ── Bulk delete ──────────────────────────────────────────
  $(document).on(
    "click",
    '[data-cat-table-select="deactivate_selected"]',
    function () {
      const selectedIds = $(".cat-row-checkbox:checked")
        .map(function () {
          return $(this).val();
        })
        .get();

      if (selectedIds.length === 0) return;

      SwalPopup.warning({
        confirmText: "Yes, delete!",
        text: "Are you sure you want to delete selected categories?",
      }).then(async function (result) {
        if (result.value) {
          const res = await request(`${categoryUrl}/bulk-delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ ids: selectedIds }),
          });
          if (res.success) {
            SwalPopup.success("Selected categories deleted successfully");
            categoryTable.ajax.reload();
          } else {
            SwalPopup.error(res.message || "Something went wrong");
          }
          $("#cat-select-all").prop("checked", false);
          updateCatBulkToolbar();
        }
      });
    },
  );

  // ── Delete single ────────────────────────────────────────
  $(document).on("click", ".delete-category", function (e) {
    e.preventDefault();
    const id = $(this).data("id");
    const name = $(this).data("name");

    SwalPopup.warning({
      text: `Are you sure you want to delete "${name}"?`,
      confirmText: "Yes, delete it!",
    }).then(async function (result) {
      if (result.value) {
        try {
          const res = await request(`${categoryUrl}/${id}`, {
            method: "DELETE",
          });
          if (res.success) {
            SwalPopup.success(res.message || "Category deleted successfully");
            categoryTable.ajax.reload();
          } else {
            SwalPopup.error(res.message || "Something went wrong");
          }
        } catch (err) {
          SwalPopup.error("Something went wrong");
        }
      }
    });
  });
});

// ── Bulk toolbar visibility ──────────────────────────────
function updateCatBulkToolbar() {
  const checkedCount = $(".cat-row-checkbox:checked").length;
  const baseToolbar = $('[data-cat-table-toolbar="base"]');
  const selectedToolbar = $('[data-cat-table-toolbar="selected"]');
  const selectedCount = $('[data-cat-table-select="selected_count"]');

  if (checkedCount > 0) {
    baseToolbar.addClass("d-none");
    selectedToolbar.removeClass("d-none");
    selectedCount.text(checkedCount);
  } else {
    baseToolbar.removeClass("d-none");
    selectedToolbar.addClass("d-none");
  }
}