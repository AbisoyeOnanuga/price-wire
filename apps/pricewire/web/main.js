const form = document.querySelector("#quote-form");
const results = document.querySelector("#results");
const submitBtn = document.querySelector("#submit-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.querySelector("#title").value.trim();
  const condition = document.querySelector("#condition").value;

  submitBtn.disabled = true;
  results.classList.remove("hidden");
  results.innerHTML = "<p>Running Gemma → comps → TabPFN…</p>";

  try {
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, condition }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Request failed");
    }
    renderQuote(data);
  } catch (err) {
    results.innerHTML = `<p class="error">${err instanceof Error ? err.message : "Unknown error"}</p>`;
  } finally {
    submitBtn.disabled = false;
  }
});

function renderQuote(q) {
  const rows = q.comps
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.title)}</td><td>${c.platform}</td><td>$${c.sold_price}</td><td>${c.source}</td></tr>`,
    )
    .join("");

  results.innerHTML = `
    <h2>Suggested listing price</h2>
    <div class="price-grid">
      <div class="stat"><span>List at</span><strong>$${q.suggested_price}</strong></div>
      <div class="stat"><span>Quick sale</span><strong>$${q.quick_sale_price}</strong></div>
      <div class="stat"><span>Hold</span><strong>$${q.hold_price}</strong></div>
      <div class="stat"><span>Confidence</span><strong>${q.confidence}</strong></div>
    </div>
    <p>${q.comp_count} comps · method: <code>${q.method}</code></p>
    <table>
      <thead><tr><th>Comp</th><th>Platform</th><th>Sold</th><th>Source</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="brief" id="brief">${escapeHtml(q.listing_brief)}</div>
    <div class="copy-row">
      <button type="button" class="ghost" id="copy-brief">Copy listing brief</button>
    </div>
  `;

  document.querySelector("#copy-brief")?.addEventListener("click", () => {
    navigator.clipboard.writeText(q.listing_brief);
  });
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
