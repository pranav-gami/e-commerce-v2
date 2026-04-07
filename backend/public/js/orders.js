const orderUrl = "/admin/orders";

const STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_BADGE = {
  PENDING: "badge-light-warning",
  CONFIRMED: "badge-light-info",
  SHIPPED: "badge-light-primary",
  DELIVERED: "badge-light-success",
  CANCELLED: "badge-light-danger",
};

let orderTable;

$(document).ready(function () {
  orderTable = $("#orders-table").DataTable({
    serverSide: false,
    processing: true,
    ajax: {
      url: orderUrl,
      type: "GET",
      headers: { Accept: "application/json" },
      dataSrc: function (json) {
        return json.data?.orders || [];
      },
      cache: false,
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
        title: "Order ID",
        orderable: true,
        render: function (data, type) {
          if (type === "sort" || type === "type") {
            return parseInt(data);
          }
          return `<span class="fw-bold text-gray-800">#${data}</span>`;
        },
      },
      {
        data: "user",
        title: "Customer",
        orderable: false,
        render: function (data) {
          if (!data) return "N/A";
          return `
            <div class="d-flex align-items-center">
              <div class="symbol symbol-40px me-3">
                <div class="symbol-label fs-5 bg-light-primary text-primary fw-bold">
                  ${data.name ? data.name.charAt(0).toUpperCase() : "?"}
                </div>
              </div>
              <div>
                <a href="/admin/users/${data.id}" class="text-gray-800 text-hover-primary fw-bold mb-1">
                  ${data.name || "N/A"}
                </a>
                <div class="text-muted fs-7">${data.email || ""}</div>
              </div>
            </div>`;
        },
      },
      {
        data: "total",
        title: "Total",
        orderable: true,
        render: function (data) {
          return `<span class="fw-bold text-gray-800">₹${parseFloat(data).toFixed(2)}</span>`;
        },
      },
      {
        data: "items",
        title: "Items",
        orderable: false,
        render: function (data) {
          return `<span class="badge badge-light-primary">${data?.length || 0} item${data?.length !== 1 ? "s" : ""}</span>`;
        },
      },
      {
        data: "status",
        title: "Status",
        orderable: true,
        render: function (data) {
          const cls = STATUS_BADGE[data] || "badge-light-secondary";
          return `<span class="badge ${cls}">${data}</span>`;
        },
      },
      {
        data: "createdAt",
        title: "Date",
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
          const canEdit = !["DELIVERED", "CANCELLED"].includes(row.status);
          const customerName = (row.user?.name || "N/A")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
          const editItem = canEdit
            ? `<div class="menu-item px-3">
                <a class="menu-link px-3 edit-order-status" href="#"
                  data-id="${row.id}"
                  data-status="${row.status}"
                  data-customer="${customerName}">
                  Edit Status
                </a>
               </div>`
            : `<div class="menu-item px-3">
                <span class="menu-link px-3 text-muted" style="cursor:not-allowed;">
                  Edit Status
                </span>
               </div>`;

          return `
            <div class="dropdown">
              <button class="btn btn-light btn-active-light-primary btn-sm dropdown-toggle"
                type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Actions
              </button>
              <ul class="dropdown-menu menu menu-sub menu-sub-dropdown menu-column menu-rounded
                menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-150px py-4">
                <li class="menu-item px-3">
                  <a class="menu-link px-3" href="/admin/orders/${row.id}">View Details</a>
                </li>
                <li>${editItem}</li>
              </ul>
            </div>`;
        },
      },
    ],
    order: [[1, "desc"]],
    language: {
      loadingRecords: '',
      processing: '<div class="d-flex align-items-center justify-content-center gap-3 py-2"><div class="spinner-border text-primary" style="width:1.75rem;height:1.75rem;border-width:3px;" role="status"><span class="visually-hidden">Loading...</span></div><span class="text-muted fs-7 fw-semibold">Loading...</span></div>',
    },
  });

  orderTable.on("draw", function () {
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((el) => {
      const existing = bootstrap.Dropdown.getInstance(el);
      if (existing) existing.dispose();
      new bootstrap.Dropdown(el);
    });
  });

  let searchTimer;
  $("#order-table-search").keyup(function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      orderTable.search(this.value).draw();
    }, 500);
  });

  $("#order-status-filter").on("change", function () {
    orderTable.column(5).search(this.value).draw();
  });

  $(document).on("click", ".edit-order-status", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const id = $(this).data("id");
    const status = $(this).data("status");
    const customer = $(this).data("customer");

    $("#edit-order-id").val(id);
    $("#edit-order-display-id").val(`#${id}`);
    $("#edit-order-customer").val(customer);
    $("#edit-current-status").val(status);

    const transitions = STATUS_TRANSITIONS[status] || [];
    const $select = $("#edit-new-status");
    $select.empty().append('<option value="">Select new status</option>');
    transitions.forEach((s) => {
      $select.append(`<option value="${s}">${s}</option>`);
    });

    $("#edit-status-hint").text(
      transitions.length === 0
        ? "No further transitions allowed."
        : `${transitions.length} option(s) available.`,
    );

    $(".dropdown-menu").removeClass("show");
    new bootstrap.Modal(document.getElementById("editOrderStatusModal")).show();
  });

  $(document).on("click", "#save-edit-order-status", async function () {
    const id = $("#edit-order-id").val();
    const status = $("#edit-new-status").val();

    if (!status) return SwalPopup.error("Please select a new status");

    const res = await request(`${orderUrl}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ status }),
    });

    $("#editOrderStatusModal").modal("hide");

    if (res.success) {
      SwalPopup.success(res.message || "Order status updated successfully");
      orderTable.ajax.reload();
    } else {
      SwalPopup.error(res.message || "Something went wrong");
    }
  });
});