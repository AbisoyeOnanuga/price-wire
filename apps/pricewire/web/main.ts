type Quote = {
  suggested_price: number;
  quick_sale_price: number;
  hold_price: number;
  confidence: string;
  comp_count: number;
  method: string;
  listing_brief: string;
  comps: Array<{
    title: string;
    platform: string;
    sold_price: number;
    condition_grade: string;
    source: string;
  }>;
};

type Health = {
  database: boolean;
  serpapi: boolean;
  tabpfn: boolean;
  gemma: boolean;
};

const form = document.querySelector<HTMLFormElement>("#quote-form")!;
const results = document.querySelector<HTMLElement>("#results")!;
const submitBtn = document.querySelector<HTMLButtonElement>("#submit-btn")!;
const statusLine = document.querySelector<HTMLElement>("#integration-status")!;

void loadHealth();

async function loadHealth() {
  try {
    const res = await fetch("/api/health");
    const h = (await res.json()) as Health;
    const parts = [
      h.gemma ? '<span class="on">Gemma</span>' : "Gemma off",
      h.tabpfn ? '<span class="on">TabPFN</span>' : "TabPFN off",
      h.database ? '<span class="on">Tiger</span>' : "seed comps",
      h.serpapi ? '<span class="on">SerpApi</span>' : "SerpApi off",
    ];
    statusLine.innerHTML = `Pipeline: ${parts.join(" · ")}`;
  } catch {
    statusLine.textContent = "API offline — start the server with npm run dev";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = (
    document.querySelector<HTMLInputElement>("#title")!.value ?? ""
  ).trim();
  const condition =
    document.querySelector<HTMLSelectElement>("#condition")!.value;

  submitBtn.disabled = true;
  results.classList.remove("hidden");
  results.innerHTML = `
    <div class="loading" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <span>Extracting specs, pulling comps, running TabPFN…</span>
    </div>
  `;

  try {
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, condition }),
    });
    const data = (await res.json()) as Quote & { error?: string };
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

function renderQuote(q: Quote) {
  const rows = q.comps
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.title)}</td><td>${c.platform}</td><td>$${c.sold_price}</td><td>${c.source}</td></tr>`,
    )
    .join("");

  results.innerHTML = `
    <h2 class="results-title">Your wire</h2>
    <div class="price-grid">
      <div class="stat featured"><span>List at</span><strong>$${q.suggested_price}</strong></div>
      <div class="stat"><span>Quick sale</span><strong>$${q.quick_sale_price}</strong></div>
      <div class="stat"><span>Hold</span><strong>$${q.hold_price}</strong></div>
      <div class="stat"><span>Confidence</span><strong>${q.confidence}</strong></div>
    </div>
    <p class="meta-row">${q.comp_count} comps · <code>${q.method}</code></p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Comp</th><th>Platform</th><th>Sold</th><th>Source</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="brief" id="brief">${escapeHtml(q.listing_brief)}</div>
    <div class="copy-row">
      <button type="button" class="ghost" id="copy-brief">Copy listing brief</button>
    </div>
  `;

  document.querySelector("#copy-brief")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(q.listing_brief);
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
