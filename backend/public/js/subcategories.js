const filterOptions = { search: "", filters: {} };
const subCategoryUrl = "/admin/subcategories";
let subTable;

$(document).ready(function () {
  subTable = $("#subcategories-table").DataTable({
    serverSide: false,
    processing: true,
    ajax: {
      url: subCategoryUrl,
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
          return `<input type="checkbox" class="form-check-input sub-row-checkbox" value="${data}">`;
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
        data: "description",
        title: "Description",
        render: (d) => d || "-",
      },
      {
        data: "category",
        title: "Category",
        render: function (data) {
          return data?.name
            ? `<span class="badge badge-light-primary">${data.name}</span>`
            : "-";
        },
      },
      {
        data: "createdAt",
        title: "Created At",
        orderable: true,
        render: (d) => new Date(d).toLocaleDateString(),
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
                  <a class="menu-link px-3 edit-subcategory" href="#"
                    data-id="${row.id}"
                    data-name="${row.name}"
                    data-description="${row.description || ""}"
                    data-categoryid="${row.categoryId}">
                    Edit
                  </a>
                </div>
                <div class="menu-item px-3">
                  <a class="menu-link px-3 text-danger delete-subcategory" href="#"
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
    language: {
      loadingRecords: '',
      processing: '<div class="d-flex align-items-center justify-content-center gap-3 py-2"><div class="spinner-border text-primary" style="width:1.75rem;height:1.75rem;border-width:3px;" role="status"><span class="visually-hidden">Loading...</span></div><span class="text-muted fs-7 fw-semibold">Loading...</span></div>',
    },
  });

  // ── Reinit dropdowns after draw ─────────────────────────
  subTable.on("draw", function () {
    $("#sub-select-all").prop("checked", false);
    updateSubBulkToolbar();
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((el) => {
      new bootstrap.Dropdown(el);
    });
  });

  // ── Search ───────────────────────────────────────────────
  let searchTimer;
  $("#sub-table-search").keyup(function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      subTable.search(this.value).draw();
    }, 500);
  });

  // ── Filter by Category ───────────────────────────────────
  $("#sub-filter-category").on("change", function () {
    const categoryId = $(this).val();
    const url = categoryId
      ? `${subCategoryUrl}?categoryId=${categoryId}`
      : subCategoryUrl;

    subTable.ajax.url(url).load();
    $("#sub-select-all").prop("checked", false);
    updateSubBulkToolbar();
  });

  // ── Reset Filter ─────────────────────────────────────────
  $("#sub-reset-filter").on("click", function () {
    $("#sub-filter-category").val("");
    $("#sub-table-search").val("");
    subTable.search("").ajax.url(subCategoryUrl).load();
    $("#sub-select-all").prop("checked", false);
    updateSubBulkToolbar();
  });

  // ── Select all ───────────────────────────────────────────
  $(document).on("change", "#sub-select-all", function () {
    $(".sub-row-checkbox").prop("checked", $(this).prop("checked"));
    updateSubBulkToolbar();
  });

  // ── Individual checkbox ──────────────────────────────────
  $(document).on("change", ".sub-row-checkbox", function () {
    const allChecked =
      $(".sub-row-checkbox:checked").length === $(".sub-row-checkbox").length;
    $("#sub-select-all").prop("checked", allChecked);
    updateSubBulkToolbar();
  });

  // ── Bulk delete ──────────────────────────────────────────
  $(document).on(
    "click",
    '[data-sub-table-select="deactivate_selected"]',
    function () {
      const selectedIds = $(".sub-row-checkbox:checked")
        .map(function () {
          return $(this).val();
        })
        .get();

      if (selectedIds.length === 0) return;

      SwalPopup.warning({
        confirmText: "Yes, delete!",
        text: "Are you sure you want to delete selected sub-categories?",
      }).then(async function (result) {
        if (result.value) {
          const res = await request(`${subCategoryUrl}/bulk-delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ ids: selectedIds }),
          });
          if (res.success) {
            SwalPopup.success("Selected sub-categories deleted successfully");
            subTable.ajax.reload();
          } else {
            SwalPopup.error(res.message || "Something went wrong");
          }
          $("#sub-select-all").prop("checked", false);
          updateSubBulkToolbar();
        }
      });
    },
  );

  // ── Add subcategory ──────────────────────────────────────
  $("#save-add-subcategory").on("click", async function () {
    const name = $("#add-sub-name").val().trim();
    const description = $("#add-sub-description").val().trim();
    const categoryId = $("#add-sub-categoryId").val();

    if (!name) return SwalPopup.error("Name is required");
    if (!categoryId) return SwalPopup.error("Please select a category");

    try {
      const res = await request(subCategoryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name, description, categoryId }),
      });

      if (res.success) {
        $("#addSubCategoryModal").modal("hide");
        $("#add-sub-name").val("");
        $("#add-sub-description").val("");
        $("#add-sub-categoryId").val("");
        SwalPopup.success("Sub category created successfully");
        subTable.ajax.reload();
      } else {
        SwalPopup.error(res.message || "Something went wrong");
      }
    } catch (err) {
      SwalPopup.error("Something went wrong");
    }
  });

  // ── Open edit modal ──────────────────────────────────────
  $(document).on("click", ".edit-subcategory", function (e) {
    e.preventDefault();
    $("#edit-sub-id").val($(this).data("id"));
    $("#edit-sub-name").val($(this).data("name"));
    $("#edit-sub-description").val($(this).data("description"));
    $("#edit-sub-categoryId").val($(this).data("categoryid"));
    new bootstrap.Modal(document.getElementById("editSubCategoryModal")).show();
  });

  // ── Save edit ────────────────────────────────────────────
  $("#save-edit-subcategory").on("click", async function () {
    const id = $("#edit-sub-id").val();
    const name = $("#edit-sub-name").val().trim();
    const description = $("#edit-sub-description").val().trim();
    const categoryId = $("#edit-sub-categoryId").val();

    if (!name) return SwalPopup.error("Name is required");
    if (!categoryId) return SwalPopup.error("Please select a category");

    try {
      const res = await request(`${subCategoryUrl}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name, description, categoryId }),
      });

      if (res.success) {
        $("#editSubCategoryModal").modal("hide");
        SwalPopup.success("Sub category updated successfully");
        subTable.ajax.reload();
      } else {
        SwalPopup.error(res.message || "Something went wrong");
      }
    } catch (err) {
      SwalPopup.error("Something went wrong");
    }
  });

  // ── Delete single ────────────────────────────────────────
  $(document).on("click", ".delete-subcategory", function (e) {
    e.preventDefault();
    const id = $(this).data("id");
    const name = $(this).data("name");

    SwalPopup.warning({
      text: `Are you sure you want to delete "${name}"?`,
      confirmText: "Yes, delete it!",
    }).then(async function (result) {
      if (result.value) {
        try {
          const res = await request(`${subCategoryUrl}/${id}`, {
            method: "DELETE",
          });
          if (res.success) {
            SwalPopup.success(res.message || "Sub category deleted");
            subTable.ajax.reload();
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
function updateSubBulkToolbar() {
  const checkedCount = $(".sub-row-checkbox:checked").length;
  const baseToolbar = $('[data-sub-table-toolbar="base"]');
  const selectedToolbar = $('[data-sub-table-toolbar="selected"]');
  const selectedCount = $('[data-sub-table-select="selected_count"]');

  if (checkedCount > 0) {
    baseToolbar.addClass("d-none");
    selectedToolbar.removeClass("d-none");
    selectedCount.text(checkedCount);
  } else {
    baseToolbar.removeClass("d-none");
    selectedToolbar.addClass("d-none");
  }
}