type ListingDraft = {
  title: string;
  description: string;
  item_specifics: Record<string, string>;
  shipping: {
    length_in: number;
    width_in: number;
    height_in: number;
    weight_lb: number;
    package_note: string;
  };
  condition_label: string;
  condition_marketing_tip: string;
};

type Quote = {
  suggested_price: number;
  quick_sale_price: number;
  hold_price: number;
  confidence: string;
  confidence_label: string;
  comp_count: number;
  method_label: string;
  listing_brief: string;
  listing_draft: ListingDraft;
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

type ConditionOption = {
  value: string;
  label: string;
  marketing_note: string;
};

const form = document.querySelector<HTMLFormElement>("#quote-form")!;
const results = document.querySelector<HTMLElement>("#results")!;
const submitBtn = document.querySelector<HTMLButtonElement>("#submit-btn")!;
const statusLine = document.querySelector<HTMLElement>("#integration-status")!;
const conditionSelect = document.querySelector<HTMLSelectElement>("#condition")!;
const conditionHint = document.querySelector<HTMLElement>("#condition-hint")!;
const themeToggle = document.querySelector<HTMLButtonElement>("#theme-toggle")!;

let conditionOptions: ConditionOption[] = [];

void loadHealth();
void loadConditions();
initTheme();

function initTheme() {
  const root = document.documentElement;
  const updateLabel = () => {
    const light = root.getAttribute("data-theme") === "light";
    themeToggle.querySelector(".theme-toggle-label")!.textContent = light
      ? "Dark mode"
      : "Light mode";
  };
  updateLabel();
  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("pricewire-theme", next);
    updateLabel();
  });
}

async function loadConditions() {
  try {
    const res = await fetch("/api/conditions");
    conditionOptions = (await res.json()) as ConditionOption[];
    conditionSelect.innerHTML = conditionOptions
      .map(
        (o) =>
          `<option value="${escapeAttr(o.value)}">${escapeHtml(o.label)}</option>`,
      )
      .join("");
    conditionSelect.value = "good";
    updateConditionHint();
    conditionSelect.addEventListener("change", updateConditionHint);
  } catch {
    conditionSelect.innerHTML =
      '<option value="good">Good</option><option value="like_new">Like new</option>';
  }
}

function updateConditionHint() {
  const match = conditionOptions.find((c) => c.value === conditionSelect.value);
  conditionHint.textContent = match?.marketing_note ?? "";
}

async function loadHealth() {
  try {
    const res = await fetch("/api/health");
    const h = (await res.json()) as Health;
    const parts = [
      h.gemma ? '<span class="on">Gemma</span>' : "Gemma off",
      h.tabpfn ? '<span class="on">TabPFN</span>' : "TabPFN off",
      h.database ? '<span class="on">Tiger</span>' : "sample sales",
      h.serpapi ? '<span class="on">SerpApi</span>' : "SerpApi off",
    ];
    statusLine.innerHTML = `Data: ${parts.join(" · ")}`;
  } catch {
    statusLine.textContent = "API offline — start the server with npm run dev";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = (
    document.querySelector<HTMLInputElement>("#title")!.value ?? ""
  ).trim();
  const condition = conditionSelect.value;

  submitBtn.disabled = true;
  results.classList.remove("hidden");
  results.innerHTML = `
    <div class="loading" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <span>Matching similar sales and drafting your listing…</span>
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

  const specsRows = Object.entries(q.listing_draft.item_specifics)
    .map(
      ([k, v]) =>
        `<div class="spec-row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`,
    )
    .join("");

  const ship = q.listing_draft.shipping;

  results.innerHTML = `
    <h2 class="results-title">Price &amp; listing draft</h2>
    <div class="price-grid">
      <div class="stat featured"><span>Suggested price</span><strong>$${q.suggested_price}</strong></div>
      <div class="stat"><span>Quick sale</span><strong>$${q.quick_sale_price}</strong></div>
      <div class="stat"><span>Hold firm</span><strong>$${q.hold_price}</strong></div>
      <div class="stat"><span>Match quality</span><strong>${escapeHtml(q.confidence_label)}</strong></div>
    </div>
    <p class="meta-row">${q.comp_count} similar sale${q.comp_count === 1 ? "" : "s"} · ${escapeHtml(q.method_label)}</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Similar sale</th><th>Platform</th><th>Sold for</th><th>Data</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="draft-block">
      <h3>Listing starter</h3>
      <p class="field-hint">${escapeHtml(q.listing_draft.condition_marketing_tip)}</p>
      <div class="draft-field">
        <label for="draft-title">Title</label>
        <div class="draft-box" id="draft-title">${escapeHtml(q.listing_draft.title)}</div>
        <div class="copy-row"><button type="button" class="ghost" data-copy="draft-title">Copy title</button></div>
      </div>
      <div class="draft-field">
        <label for="draft-desc">Description</label>
        <div class="draft-box" id="draft-desc">${escapeHtml(q.listing_draft.description)}</div>
        <div class="copy-row"><button type="button" class="ghost" data-copy="draft-desc">Copy description</button></div>
      </div>
      <div class="draft-field">
        <label>Item specifics</label>
        <div class="specs-grid">${specsRows}</div>
      </div>
      <div class="draft-field">
        <label>Shipping estimate (verify before labels)</label>
        <div class="draft-box">
          ${ship.length_in} × ${ship.width_in} × ${ship.height_in} in · ~${ship.weight_lb} lb packed
        </div>
        <p class="shipping-callout"><span class="warn">Verify:</span> ${escapeHtml(ship.package_note)}</p>
      </div>
    </div>

    <div class="brief" id="brief">${escapeHtml(q.listing_brief)}</div>
    <div class="copy-row">
      <button type="button" class="ghost" id="copy-brief">Copy price summary</button>
    </div>
  `;

  document.querySelector("#copy-brief")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(q.listing_brief);
  });

  results.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-copy");
      const el = id ? document.getElementById(id) : null;
      if (el) await navigator.clipboard.writeText(el.textContent ?? "");
    });
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
