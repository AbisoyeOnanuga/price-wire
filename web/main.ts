import { compSourceLabel } from "./comp-labels.js";

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
  database_configured?: boolean;
  database_live?: boolean;
  database?: boolean;
  serpapi: boolean;
  tabpfn: boolean;
  gemma: boolean;
};

type ConditionOption = {
  value: string;
  label: string;
  marketing_note: string;
  helper_text?: string;
  requires_detail?: boolean;
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
const celebrateLayer =
  document.querySelector<HTMLElement>("#celebrate-layer")!;

let conditionOptions: ConditionOption[] = [];
let lastSubmitPointer: { x: number; y: number } | null = null;

submitBtn.addEventListener("pointerdown", (e) => {
  lastSubmitPointer = { x: e.clientX, y: e.clientY };
});

conditionOptions = Array.from(conditionSelect.options).map((o) => ({
  value: o.value,
  label: o.textContent ?? o.value,
  marketing_note: "",
}));
updateConditionHint();

void loadHealth();
void loadConditions();
initTheme();
initInteractiveDemoPanel();

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
      const prev = conditionSelect.value || "used";
      conditionSelect.innerHTML = conditionOptions
        .map(
          (o) =>
            `<option value="${escapeAttr(o.value)}">${escapeHtml(o.label)}</option>`,
        )
        .join("");
      conditionSelect.value = conditionOptions.some((c) => c.value === prev)
        ? prev
        : "used";
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
  const match = conditionOptions.find((c) => c.value === value);
  if (match?.requires_detail !== undefined) return match.requires_detail;
  return value !== "new";
}

function updateConditionHint() {
  const match = conditionOptions.find((c) => c.value === conditionSelect.value);
  const parts = [match?.helper_text, match?.marketing_note].filter(Boolean);
  conditionHint.textContent = parts.join(" — ");
  conditionHint.classList.remove("field-context-error");
  const showDetail = needsConditionDetail(conditionSelect.value);
  conditionDetailWrap.classList.toggle("hidden", !showDetail);
  conditionDetailInput.required = showDetail;
  if (!showDetail) {
    conditionDetailInput.value = "";
  }
}

const CELEBRATE_PALETTE = [
  "#d4a574",
  "#e8c49a",
  "#f5ebe0",
  "#2d6b4f",
  "#a66b2e",
  "#fffdf8",
  "#7dd3a8",
];

function spawnCelebrationParticles(
  x: number,
  y: number,
  opts: { count: number; spread: number; soft?: boolean },
) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const host = celebrateLayer ?? document.body;

  for (let i = 0; i < opts.count; i++) {
    const bit = document.createElement("span");
    bit.className = "submit-confetti";
    if (opts.soft) bit.classList.add("confetti-soft");
    if (Math.random() > 0.38) bit.classList.add("is-spark");

    const angle = Math.random() * Math.PI * 2;
    const speed = opts.spread * (0.35 + Math.random() * 0.65);
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed - speed * 0.15;
    const w = 3 + Math.random() * 8;
    const h = 2 + Math.random() * 6;

    bit.style.left = `${x}px`;
    bit.style.top = `${y}px`;
    bit.style.width = `${w}px`;
    bit.style.height = `${h}px`;
    bit.style.background =
      CELEBRATE_PALETTE[Math.floor(Math.random() * CELEBRATE_PALETTE.length)] ??
      CELEBRATE_PALETTE[0];
    bit.style.setProperty("--dx", `${dx}px`);
    bit.style.setProperty("--dy", `${dy}px`);
    bit.style.setProperty(
      "--spin",
      `${Math.floor(Math.random() * 540 - 270)}deg`,
    );
    bit.style.animationDelay = `${Math.random() * 0.28}s`;

    host.appendChild(bit);
    bit.addEventListener("animationend", () => bit.remove(), { once: true });
  }
}

function showCopyPop(x: number, y: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const host = celebrateLayer ?? document.body;
  const pop = document.createElement("span");
  pop.className = "copy-pop";
  pop.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  host.appendChild(pop);
  pop.addEventListener("animationend", () => pop.remove(), { once: true });
}

function pointerFromEvent(
  ev: Event,
  fallbackEl: HTMLElement,
): { x: number; y: number } {
  const e = ev as MouseEvent;
  if (typeof e.clientX === "number" && typeof e.clientY === "number") {
    return { x: e.clientX, y: e.clientY };
  }
  const rect = fallbackEl.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

async function copyWithCelebrate(
  text: string,
  anchor: HTMLElement,
  ev: Event,
) {
  await navigator.clipboard.writeText(text);
  const { x, y } = pointerFromEvent(ev, anchor);
  spawnCelebrationParticles(x, y, { count: 32, spread: 48, soft: true });
  showCopyPop(x, y);
}

function runSubmitCelebrate(btn: HTMLButtonElement) {
  const rect = btn.getBoundingClientRect();
  const cx = lastSubmitPointer?.x ?? rect.left + rect.width / 2;
  const cy = lastSubmitPointer?.y ?? rect.top + rect.height / 2;
  spawnCelebrationParticles(cx, cy, { count: 72, spread: 62 });
  lastSubmitPointer = null;
}

function serviceChip(
  name: string,
  state: "on" | "off" | "warn",
  statusText: string,
): string {
  return `<span class="svc-chip svc-${state}" title="${escapeAttr(`${name}: ${statusText}`)}"><span class="svc-dot" aria-hidden="true"></span><span class="svc-name">${escapeHtml(name)}</span><span class="svc-status-text">${escapeHtml(statusText)}</span></span>`;
}

function initInteractiveDemoPanel() {
  const panel = document.querySelector<HTMLElement>("#sample-panel");
  if (!panel) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll<HTMLElement>(".demo-price").forEach((priceEl) => {
    wrapPriceDigits(priceEl);
    const base = Number(priceEl.dataset.base ?? "0");
    priceEl.addEventListener("mouseenter", () => {
      if (!reduced) flipPriceDigits(priceEl, base);
    });
    priceEl.querySelectorAll<HTMLElement>(".price-digit").forEach((digit) => {
      digit.addEventListener("mouseenter", () => {
        digit.classList.add("lift");
      });
      digit.addEventListener("mouseleave", () => {
        digit.classList.remove("lift");
      });
    });
  });

  if (!reduced) {
    window.setInterval(() => {
      const prices = [...document.querySelectorAll<HTMLElement>(".demo-price")];
      const pick = prices[Math.floor(Math.random() * prices.length)];
      if (!pick) return;
      const base = Number(pick.dataset.base ?? "0");
      const delta = Math.floor(Math.random() * 7) - 3;
      setPriceValue(pick, Math.max(50, base + delta), true);
    }, 4200);

    panel.addEventListener("mousemove", (e) => {
      const rect = panel.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      panel.style.transform = `rotateX(${-y * 7}deg) rotateY(${x * 9}deg)`;
    });

    panel.addEventListener("mouseleave", () => {
      panel.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
  }
}

function wrapPriceDigits(priceEl: HTMLElement) {
  const digits = priceEl.querySelector<HTMLElement>(".price-digits");
  if (!digits) return;
  const text = digits.textContent ?? "";
  digits.innerHTML = text
    .split("")
    .map((ch) => `<span class="price-digit">${escapeHtml(ch)}</span>`)
    .join("");
}

function setPriceValue(priceEl: HTMLElement, value: number, animate: boolean) {
  const digits = priceEl.querySelector<HTMLElement>(".price-digits");
  if (!digits) return;
  const str = String(value);
  if (animate) {
    digits.querySelectorAll<HTMLElement>(".price-digit").forEach((d) => {
      d.classList.add("flip");
      window.setTimeout(() => d.classList.remove("flip"), 360);
    });
    window.setTimeout(() => {
      digits.innerHTML = str
        .split("")
        .map((ch) => `<span class="price-digit">${escapeHtml(ch)}</span>`)
        .join("");
      bindDigitLift(priceEl);
    }, 180);
  } else {
    digits.textContent = str;
    wrapPriceDigits(priceEl);
    bindDigitLift(priceEl);
  }
}

function bindDigitLift(priceEl: HTMLElement) {
  priceEl.querySelectorAll<HTMLElement>(".price-digit").forEach((digit) => {
    digit.addEventListener("mouseenter", () => digit.classList.add("lift"));
    digit.addEventListener("mouseleave", () => digit.classList.remove("lift"));
  });
}

function flipPriceDigits(priceEl: HTMLElement, base: number) {
  const delta = Math.floor(Math.random() * 11) - 5;
  setPriceValue(priceEl, Math.max(50, base + delta), true);
  window.setTimeout(() => setPriceValue(priceEl, base, true), 900);
}

async function loadHealth() {
  try {
    const res = await fetch("/api/health?verbose=1");
    const h = (await res.json()) as Health;
    const dbConfigured =
      h.database_configured ?? h.database ?? false;
    const tigerState = dbConfigured
      ? h.database_live
        ? "on"
        : "warn"
      : "warn";
    const salesDataStatus =
      dbConfigured && h.database_live
        ? "online"
        : "offline — practice examples";

    statusLine.innerHTML = [
      serviceChip(
        "Listing AI",
        h.gemma ? "on" : "off",
        h.gemma ? "online" : "offline",
      ),
      serviceChip(
        "Price model",
        h.tabpfn ? "on" : "off",
        h.tabpfn ? "online" : "offline — pricing rules",
      ),
      serviceChip("Sale prices", tigerState, salesDataStatus),
      serviceChip(
        "Online listings",
        h.serpapi ? "on" : "off",
        h.serpapi ? "online" : "offline",
      ),
    ].join("");
  } catch {
    statusLine.innerHTML =
      '<span class="svc-status-offline">Offline</span>';
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

  if (needsConditionDetail(condition) && !condition_detail) {
    conditionDetailWrap.classList.remove("hidden");
    conditionDetailInput.focus();
    conditionDetailInput.setAttribute("aria-invalid", "true");
    conditionHint.textContent =
      "Add condition details before continuing—buyers need to know about wear, defects, and what is included.";
    conditionHint.classList.add("field-context-error");
    return;
  }
  conditionDetailInput.removeAttribute("aria-invalid");
  conditionHint.classList.remove("field-context-error");

  const scrollY = window.scrollY;
  runSubmitCelebrate(submitBtn);
  submitBtn.disabled = true;
  results.classList.remove("hidden");
  results.innerHTML = `
    <div class="loading" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <span>Matching similar sales and drafting your listing…</span>
    </div>
  `;
  window.scrollTo(0, scrollY);

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
    results.innerHTML = `<p class="error">${escapeHtml(err instanceof Error ? err.message : "Unknown error")}</p>`;
  } finally {
    submitBtn.disabled = false;
  }
});

function renderQuote(q: Quote) {
  const rows = q.comps
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.title)}</td><td>${escapeHtml(c.platform)}</td><td>$${c.sold_price}</td><td>${escapeHtml(compSourceLabel(c.source))}</td></tr>`,
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
      <div class="stat featured"><span>Suggested price</span><strong class="price-animate">$${q.suggested_price}</strong></div>
      <div class="stat"><span>Quick sale</span><strong class="price-animate" style="animation-delay:0.08s">$${q.quick_sale_price}</strong></div>
      <div class="stat"><span>Hold firm</span><strong class="price-animate" style="animation-delay:0.16s">$${q.hold_price}</strong></div>
      <div class="stat"><span>Match quality</span><strong>${escapeHtml(q.confidence_label)}</strong></div>
    </div>
    <p class="meta-row">${formatCompMeta(q)}</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Listing</th><th>Where</th><th>Price</th><th>Source</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="draft-block listing-setup">
      <h3>Five-minute listing draft</h3>
      <p class="field-hint">${escapeHtml(q.listing_draft.condition_marketing_tip)}</p>
      <p class="setup-lede">Prototype focus: <strong>price band</strong> and <strong>description copy</strong> for electronics. Paste title and description field-by-field; add category specifics only where the marketplace asks.</p>
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
      btn.addEventListener("click", async (ev) => {
        const id = btn.getAttribute("data-copy-target");
        const el = id ? document.getElementById(id) : null;
        if (el) await copyWithCelebrate(el.textContent ?? "", btn, ev);
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
    host.querySelector("#copy-essentials-btn")?.addEventListener("click", async (ev) => {
      const btn = ev.currentTarget as HTMLButtonElement;
      await copyWithCelebrate(packet.copy_essentials_text, btn, ev);
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
                <div class="draft-box-wrap${f.multiline ? " scrollable" : ""}">
                  <div class="draft-box${f.multiline ? " multiline" : ""}" id="${fieldId}">${escapeHtml(f.value)}</div>
                </div>
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

  document.querySelector("#copy-brief")?.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget as HTMLButtonElement;
    await copyWithCelebrate(q.listing_brief, btn, ev);
  });
}

function formatCompMeta(q: Quote): string {
  const online = q.comps.filter((c) => c.source === "serpapi").length;
  const examples = q.comps.filter((c) => c.source === "seed").length;
  const saved = q.comps.filter((c) => c.source === "tiger").length;
  const parts = [
    `${q.comp_count} listing${q.comp_count === 1 ? "" : "s"} shown`,
    online > 0 ? `${online} online now` : null,
    examples > 0 ? `${examples} example${examples === 1 ? "" : "s"} only` : null,
    saved > 0 ? `${saved} from your sales` : null,
    escapeHtml(q.method_label),
  ].filter(Boolean);
  return parts.join(" · ");
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
