const STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

$(document).ready(function () {
  // Open update status modal from detail page
  $("#open-update-status-btn").on("click", function () {
    const id = $(this).data("id");
    const status = $(this).data("status");
    openStatusModal(id, status);
  });

  // Save status update
  $("#save-order-status").on("click", async function () {
    const id = $("#update-order-id").val();
    const status = $("#new-order-status").val();

    if (!status) return SwalPopup.error("Please select a new status");

    const res = await request(`/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ status }),
    });

    $("#updateStatusModal").modal("hide");

    if (res.success) {
      SwalPopup.success(
        res.message || "Order status updated successfully",
      ).then(() => {
        window.location.reload();
      });
    } else {
      SwalPopup.error(res.message || "Something went wrong");
    }
  });
});

function openStatusModal(id, currentStatus) {
  $("#update-order-id").val(id);

  const transitions = STATUS_TRANSITIONS[currentStatus] || [];
  const $select = $("#new-order-status");
  $select.empty().append('<option value="">Select new status</option>');

  transitions.forEach((s) => {
    $select.append(`<option value="${s}">${s}</option>`);
  });

  new bootstrap.Modal(document.getElementById("updateStatusModal")).show();
}
