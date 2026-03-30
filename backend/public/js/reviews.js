"use strict";

let reviewState = {
  page: 1,
  limit: 10,
  rating: "",
  status: "",
  search: "",
  pendingDeleteId: null,
};

function renderStars(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<svg width="14" height="14" viewBox="0 0 24 24" fill="${i <= rating ? "#f4aa1a" : "#e2e8f0"}" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>`;
  }
  return `<div class="d-flex align-items-center gap-1">${html} <span class="ms-1 text-muted fs-8">(${rating})</span></div>`;
}

function truncate(str, max = 70) {
  if (!str) return "<span class='text-muted fst-italic'>No body</span>";
  return str.length > max
    ? `<span title="${str.replace(/"/g, "&quot;")}">${str.substring(0, max)}&hellip;</span>`
    : str;
}

async function loadReviews() {
  document.getElementById("reviews-loading").style.display = "block";
  document.getElementById("reviews-table-wrap").style.display = "none";
  document.getElementById("reviews-empty").style.display = "none";

  const params = new URLSearchParams({
    page: reviewState.page,
    limit: reviewState.limit,
  });
  if (reviewState.rating) params.set("rating", reviewState.rating);
  if (reviewState.status) params.set("status", reviewState.status);

  try {
    const res = await fetch(`/admin/reviews/list?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch reviews");
    const data = await res.json();

    const { reviews, pagination } = data;

    // Client-side search filter
    const search = reviewState.search.toLowerCase();
    const filtered = search
      ? reviews.filter(
          (r) =>
            r.product?.name?.toLowerCase().includes(search) ||
            r.user?.name?.toLowerCase().includes(search) ||
            r.user?.email?.toLowerCase().includes(search) ||
            r.title?.toLowerCase().includes(search) ||
            r.body?.toLowerCase().includes(search)
        )
      : reviews;

    document.getElementById("reviews-loading").style.display = "none";

    if (!filtered.length) {
      document.getElementById("reviews-empty").style.display = "block";
      document.getElementById("review-count-label").textContent = "0 reviews found";
      return;
    }

    document.getElementById("reviews-table-wrap").style.display = "block";
    document.getElementById("review-count-label").textContent = `${pagination.total} total reviews`;

    const tbody = document.getElementById("reviews-tbody");
    tbody.innerHTML = filtered
      .map(
        (r) => `
      <tr>
        <td class="ps-4">
          <div class="d-flex align-items-center gap-2">
            ${
              r.product?.image
                ? `<img src="${r.product.image}" style="width:38px;height:38px;object-fit:cover;border-radius:8px;" alt="" />`
                : `<div style="width:38px;height:38px;border-radius:8px;background:#f0f2f5;display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:#8a95a8;font-weight:700;">${r.product?.name?.charAt(0)?.toUpperCase() || "?"}</div>`
            }
            <span class="fw-semibold text-dark fs-7" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.product?.name || ""}">
              ${r.product?.name || "N/A"}
            </span>
          </div>
        </td>
        <td>
          <div class="fw-semibold text-dark fs-7">${r.user?.name || "N/A"}</div>
          <div class="text-muted fs-8">${r.user?.email || ""}</div>
        </td>
        <td>${renderStars(r.rating)}</td>
        <td style="max-width:200px;">
          ${r.title ? `<div class="fw-semibold text-dark fs-7 mb-1">${r.title}</div>` : ""}
          <div class="text-muted fs-8">${truncate(r.body)}</div>
        </td>
        <td>
          ${r.verified
            ? `<span class="badge badge-light-success">Verified</span>`
            : `<span class="badge badge-light-warning">Unverified</span>`}
        </td>
        <td>
          ${r.status === "PUBLISHED"
            ? `<span class="badge badge-light-primary">Published</span>`
            : `<span class="badge badge-light-danger">Deleted</span>`}
        </td>
        <td class="text-muted fs-8">${new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td class="text-end pe-4">
          ${r.status !== "DELETED"
            ? `<button class="btn btn-icon btn-sm btn-light-danger delete-review-btn" data-id="${r.id}" title="Delete Review">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 7H19M10 11V17M14 11V17M6 7L7 19C7 19.5523 7.44772 20 8 20H16C16.5523 20 17 19.5523 17 19L18 7M9 7V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>`
            : `<span class="text-muted fs-8 fst-italic">Removed</span>`}
        </td>
      </tr>
    `
      )
      .join("");

    // Bind delete buttons
    tbody.querySelectorAll(".delete-review-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        reviewState.pendingDeleteId = parseInt(btn.dataset.id);
        const modal = new bootstrap.Modal(document.getElementById("deleteReviewModal"));
        modal.show();
      });
    });

    // Pagination
    renderPagination(pagination);
  } catch (err) {
    document.getElementById("reviews-loading").style.display = "none";
    document.getElementById("reviews-empty").style.display = "block";
    console.error("Reviews load error:", err);
  }
}

function renderPagination(pagination) {
  const info = document.getElementById("review-pagination-info");
  const btns = document.getElementById("review-pagination-btns");

  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  info.textContent = `Showing ${from}–${to} of ${total} reviews`;

  btns.innerHTML = "";
  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.className = `btn btn-sm btn-light ${page === 1 ? "disabled" : ""}`;
  prevBtn.textContent = "← Prev";
  prevBtn.addEventListener("click", () => {
    if (reviewState.page > 1) { reviewState.page--; loadReviews(); }
  });
  btns.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && Math.abs(i - page) > 2 && i !== 1 && i !== totalPages) {
      if (i === page - 3 || i === page + 3) {
        const dot = document.createElement("span");
        dot.className = "btn btn-sm btn-light disabled";
        dot.textContent = "…";
        btns.appendChild(dot);
      }
      continue;
    }
    const pageBtn = document.createElement("button");
    pageBtn.className = `btn btn-sm ${i === page ? "btn-primary" : "btn-light"}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener("click", () => {
      reviewState.page = i;
      loadReviews();
    });
    btns.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = `btn btn-sm btn-light ${page === totalPages ? "disabled" : ""}`;
  nextBtn.textContent = "Next →";
  nextBtn.addEventListener("click", () => {
    if (reviewState.page < totalPages) { reviewState.page++; loadReviews(); }
  });
  btns.appendChild(nextBtn);
}

// Delete confirmation
document.getElementById("confirm-delete-review").addEventListener("click", async () => {
  if (!reviewState.pendingDeleteId) return;
  const btn = document.getElementById("confirm-delete-review");
  btn.disabled = true;
  btn.textContent = "Deleting...";

  try {
    const res = await fetch(`/admin/reviews/${reviewState.pendingDeleteId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    bootstrap.Modal.getInstance(document.getElementById("deleteReviewModal")).hide();
    reviewState.pendingDeleteId = null;
    await loadReviews();
    Swal.fire({ icon: "success", title: "Deleted!", text: "Review removed successfully.", timer: 2000, showConfirmButton: false });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Error", text: "Failed to delete review. Please try again." });
  } finally {
    btn.disabled = false;
    btn.textContent = "Delete";
  }
});

// Filters
document.getElementById("review-filter-btn").addEventListener("click", () => {
  reviewState.page = 1;
  reviewState.rating = document.getElementById("review-filter-rating").value;
  reviewState.status = document.getElementById("review-filter-status").value;
  reviewState.search = document.getElementById("review-search").value.trim();
  loadReviews();
});

document.getElementById("review-reset-btn").addEventListener("click", () => {
  reviewState = { page: 1, limit: 10, rating: "", status: "", search: "", pendingDeleteId: null };
  document.getElementById("review-filter-rating").value = "";
  document.getElementById("review-filter-status").value = "";
  document.getElementById("review-search").value = "";
  loadReviews();
});

document.getElementById("review-search").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("review-filter-btn").click();
});

// Init
loadReviews();
