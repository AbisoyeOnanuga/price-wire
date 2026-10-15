type ListingFormField = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  max_length?: number;
  multiline?: boolean;
};

type ListingFormSection = {
  id: string;
  title: string;
  description?: string;
  fields: ListingFormField[];
};

type PlatformId = "ebay" | "etsy" | "stockx" | "facebook";

type PlatformListingPacket = {
  platform: PlatformId;
  label: string;
  tagline: string;
  sections: ListingFormSection[];
  copy_essentials_text: string;
};

type ListingSetup = {
  default_platform: PlatformId;
  platforms: Array<{ id: PlatformId; label: string; tagline: string }>;
  price_fields: ListingFormSection;
  packets: Record<PlatformId, PlatformListingPacket>;
};

type ListingDraft = {
  title: string;
  description: string;
  item_specifics: Record<string, string>;
  shipping: {
    length_in: number;
    width_in: number;
    height_in: number;
    weight_lb: number;
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
  listing_setup: ListingSetup;
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
const conditionDetailWrap = document.querySelector<HTMLElement>(
  "#condition-detail-wrap",
)!;
const conditionDetailInput = document.querySelector<HTMLTextAreaElement>(
  "#condition-detail",
)!;
const themeToggle = document.querySelector<HTMLButtonElement>("#theme-toggle")!;

let conditionOptions: ConditionOption[] = [];

conditionOptions = Array.from(conditionSelect.options).map((o) => ({
  value: o.value,
  label: o.textContent ?? o.value,
  marketing_note: "",
}));
updateConditionHint();

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
    if (!res.ok) throw new Error("conditions unavailable");
    conditionOptions = (await res.json()) as ConditionOption[];
    if (conditionOptions.length > 0) {
      const prev = conditionSelect.value || "good";
      conditionSelect.innerHTML = conditionOptions
        .map(
          (o) =>
            `<option value="${escapeAttr(o.value)}">${escapeHtml(o.label)}</option>`,
        )
        .join("");
      conditionSelect.value = conditionOptions.some((c) => c.value === prev)
        ? prev
        : "good";
    }
  } catch {
    /* static <option> list in index.html is the fallback */
    conditionOptions = Array.from(conditionSelect.options).map((o) => ({
      value: o.value,
      label: o.textContent ?? o.value,
      marketing_note: "",
    }));
  }
  updateConditionHint();
  conditionSelect.addEventListener("change", updateConditionHint);
}

function needsConditionDetail(value: string): boolean {
  return value !== "new_sealed" && value !== "new_open_box";
}

function updateConditionHint() {
  const match = conditionOptions.find((c) => c.value === conditionSelect.value);
  conditionHint.textContent = match?.marketing_note ?? "";
  const showDetail = needsConditionDetail(conditionSelect.value);
  conditionDetailWrap.classList.toggle("hidden", !showDetail);
  if (!showDetail) {
    conditionDetailInput.value = "";
  }
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
  const condition_detail = needsConditionDetail(condition)
    ? conditionDetailInput.value.trim()
    : "";

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
      body: JSON.stringify({ title, condition, condition_detail }),
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

  const setup = q.listing_setup;
  const activePlatform = setup?.default_platform ?? "ebay";
  const platformTabs = (setup?.platforms ?? []).map(
    (p) =>
      `<button type="button" class="platform-tab${p.id === activePlatform ? " active" : ""}" data-platform="${p.id}" aria-pressed="${p.id === activePlatform}">${escapeHtml(p.label)}</button>`,
  ).join("");

  results.innerHTML = `
    <h2 class="results-title">Price &amp; listing setup</h2>
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

    <div class="draft-block listing-setup">
      <h3>Five-minute listing draft</h3>
      <p class="field-hint">${escapeHtml(q.listing_draft.condition_marketing_tip)}</p>
      <p class="setup-lede">Copy field-by-field into the marketplace UI (title first, then condition-driven description). Price goes in the site’s price box—not the description. Photos, shipping services, and shop policies stay on the platform.</p>
      <div id="price-fields" class="price-fields-copy"></div>
      <div class="platform-tabs" role="tablist" aria-label="Marketplace">${platformTabs}</div>
      <div id="platform-packet" class="platform-packet"></div>
    </div>

    <div class="brief" id="brief">${escapeHtml(q.listing_brief)}</div>
    <div class="copy-row">
      <button type="button" class="ghost" id="copy-brief">Copy price summary</button>
    </div>
  `;

  const priceHost = document.querySelector<HTMLElement>("#price-fields");
  if (priceHost && setup.price_fields) {
    priceHost.innerHTML = `
      <div class="section-group">
        <h4 class="section-group-title">Price on the site</h4>
        ${renderSections([setup.price_fields], "price")}
      </div>
    `;
    wireCopyButtons(priceHost);
  }

  let currentPlatform = activePlatform;

  function wireCopyButtons(root: ParentNode) {
    root.querySelectorAll<HTMLButtonElement>("[data-copy-target]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-copy-target");
        const el = id ? document.getElementById(id) : null;
        if (el) await navigator.clipboard.writeText(el.textContent ?? "");
      });
    });
  }

  function renderPlatformPacket(platformId: PlatformId) {
    const packet = setup.packets[platformId];
    const host = document.querySelector<HTMLElement>("#platform-packet");
    if (!packet || !host) return;

    const platformHtml = renderSections(packet.sections, platformId);

    host.innerHTML = `
      <p class="platform-tagline">${escapeHtml(packet.tagline)}</p>
      <div class="section-group">
        <h4 class="section-group-title">${escapeHtml(packet.label)} listing copy</h4>
        ${platformHtml}
      </div>
      <div class="copy-row">
        <button type="button" class="ghost primary-copy" id="copy-essentials-btn">Copy title + description</button>
      </div>
    `;

    wireCopyButtons(host);
    host.querySelector("#copy-essentials-btn")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(packet.copy_essentials_text);
    });
  }

  function renderSections(sections: ListingFormSection[], idPrefix: string): string {
    return sections
      .map((section) => {
        const fields = section.fields
          .map((f, i) => {
            const fieldId = `${idPrefix}-${section.id}-${f.id}-${i}`;
            const lenNote =
              f.max_length && f.value.length > 0
                ? ` · ${f.value.length}/${f.max_length} chars`
                : "";
            return `
              <div class="draft-field">
                <label for="${fieldId}">${escapeHtml(f.label)}${lenNote ? `<span class="char-note">${escapeHtml(lenNote)}</span>` : ""}</label>
                ${f.hint ? `<p class="field-hint">${escapeHtml(f.hint)}</p>` : ""}
                <div class="draft-box${f.multiline ? " multiline" : ""}" id="${fieldId}">${escapeHtml(f.value)}</div>
                <div class="copy-row">
                  <button type="button" class="ghost" data-copy-target="${fieldId}">Copy ${escapeHtml(f.label)}</button>
                </div>
              </div>
            `;
          })
          .join("");
        return `
          <section class="form-section">
            <h5>${escapeHtml(section.title)}</h5>
            ${section.description ? `<p class="section-desc">${escapeHtml(section.description)}</p>` : ""}
            ${fields}
          </section>
        `;
      })
      .join("");
  }

  renderPlatformPacket(currentPlatform);

  results.querySelectorAll<HTMLButtonElement>(".platform-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.getAttribute("data-platform") as PlatformId;
      currentPlatform = id;
      results.querySelectorAll(".platform-tab").forEach((t) => {
        const on = t.getAttribute("data-platform") === id;
        t.classList.toggle("active", on);
        t.setAttribute("aria-pressed", on ? "true" : "false");
      });
      renderPlatformPacket(id);
    });
  });

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

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
