/* =========================================================
   Harshit Dudeja & Co. — script.js
   ========================================================= */

/* ---------- SETTINGS (edit only this block) ---------- */
const CONFIG = {
  whatsapp: "918010917581",                 // country code + number, no + or spaces
  // Leave this empty and the query form opens WhatsApp with the message ready (no key, nothing secret in this file).
  // To receive queries by email, deploy cloudflare-worker.js (see FORM-SETUP.txt) and paste its URL here.
  formEndpoint: "",
};

// Pages share one script, so a missing element returns a harmless dummy instead of null
const NULL_EL = document.createElement("div");
const $ = (sel, root = document) => root.querySelector(sel) || NULL_EL;
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

/* ---------- WhatsApp links with pre-filled messages ---------- */
$$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa); });

/* ---------- Header: scroll shadow, mobile menu, back to top ---------- */
const header = $(".site-header");
const toTop = $("#toTop");
const nav = $("#nav");
const menuToggle = $("#menuToggle");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 10);
  toTop.hidden = window.scrollY < 700;
}, { passive: true });

toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* Dropdown submenus (click/tap; hover also works on desktop via CSS) */
function closeSubs(except) {
  $$(".has-sub.open").forEach((li) => {
    if (li === except) return;
    li.classList.remove("open");
    $(".sub-toggle", li).setAttribute("aria-expanded", "false");
  });
}
$$(".sub-toggle").forEach((btn) => btn.addEventListener("click", () => {
  const li = btn.parentElement;
  const willOpen = !li.classList.contains("open");
  closeSubs(li);
  li.classList.toggle("open", willOpen);
  btn.setAttribute("aria-expanded", String(willOpen));
}));
document.addEventListener("click", (e) => { if (!e.target.closest(".has-sub")) closeSubs(); });
$$(".sub a").forEach((a) => a.addEventListener("click", () => closeSubs()));

function setMenu(open) {
  if (!open) closeSubs();
  nav.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menuToggle.innerHTML = `<svg class="i"><use href="#i-${open ? "x" : "menu"}"/></svg>`;
}
menuToggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
$$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

$("#year").textContent = new Date().getFullYear();

/* =========================================================
   COMPLIANCE CALENDAR (builds itself from today's date)
   TDS/TCS deposit: 7th | GSTR-1 (monthly): 11th | GSTR-3B (monthly): 20th
   Advance tax: 15 Jun, 15 Sep, 15 Dec, 15 Mar
   ========================================================= */
function buildDeadlines() {
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const today = istToday();
  calendarKey = dayKey(today);
  const items = [];

  for (let k = 0; k < 4; k++) {
    const d = new Date(today.getFullYear(), today.getMonth() + k, 1);
    const y = d.getFullYear(), m = d.getMonth();
    const prev = MONTHS[(m + 11) % 12];
    // TDS deposit for March deductions is due on 30 April, otherwise the 7th
    items.push({ date: new Date(y, m, m === 3 ? 30 : 7), title: "TDS / TCS deposit", sub: `For deductions made in ${prev}` });
    items.push({ date: new Date(y, m, 11), title: "GSTR-1 filing", sub: `Monthly filers · for ${prev}` });
    items.push({ date: new Date(y, m, 20), title: "GSTR-3B filing", sub: `Monthly filers · for ${prev}` });
  }
  [[5, "1st"], [8, "2nd"], [11, "3rd"], [2, "4th"]].forEach(([m, n]) => {
    for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
      items.push({ date: new Date(y, m, 15), title: `Advance tax – ${n} instalment`, sub: "For taxpayers liable to pay advance tax" });
    }
  });

  const upcoming = items.filter((i) => i.date >= today).sort((a, b) => a.date - b.date).slice(0, 5);

  $("#deadlines").innerHTML = upcoming.map((i) => {
    const days = Math.round((i.date - today) / 86400000);
    const when = days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due in ${days} days`;
    const day = String(i.date.getDate()).padStart(2, "0");
    const mon = MONTHS[i.date.getMonth()].slice(0, 3);
    const label = `${i.date.getDate()} ${MONTHS[i.date.getMonth()]} ${i.date.getFullYear()}`;
    const msg = waLink(`Hello, please remind me about: ${i.title} (due ${label}).`);
    return `<li class="${days <= 3 ? "due-soon" : ""}">
      <div class="date-box"><b>${day}</b><span>${mon}</span></div>
      <div class="deadline-text"><strong>${i.title}</strong><small>${i.sub}</small><em class="when">${when}</em></div>
      <a class="wa-mini" href="${msg}" target="_blank" rel="noopener noreferrer" aria-label="Remind me about ${i.title} on WhatsApp"><svg class="i"><use href="#i-whatsapp"/></svg></a>
    </li>`;
  }).join("");
}
// "today" is always the date in India, whatever the visitor's device timezone is
function istToday() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("-").map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
let calendarKey = "";
buildDeadlines();
// keep it fresh if the page stays open past midnight or the tab wakes up later
setInterval(() => { if (dayKey(istToday()) !== calendarKey) buildDeadlines(); }, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden && dayKey(istToday()) !== calendarKey) buildDeadlines(); });

/* ---------- Document checklist tabs ---------- */
const tabs = $$(".tab");
function selectTab(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    $("#panel-" + t.dataset.tab).hidden = !on;
  });
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(next); next.focus();
  });
});

/* =========================================================
   ARTICLES + PRIVACY POLICY (modal)
   ========================================================= */
const ARTICLES = {
  regime: {
    title: "New vs Old Tax Regime: How to Choose the Right One",
    wa: "Hello, I want help choosing between the old and new tax regime.",
    html: `
      <p>Every individual taxpayer has to choose between two regimes. These are the rules for <b>Tax Year 2026-27 (FY 2026-27)</b>. Budget 2026 did not change the slabs, the rebate or the standard deduction.</p>
      <h4>New regime (the default)</h4>
      <ul>
        <li>Nil tax up to ₹4 lakh, then 5% (₹4–8 lakh), 10% (₹8–12 lakh), 15% (₹12–16 lakh), 20% (₹16–20 lakh), 25% (₹20–24 lakh) and 30% above ₹24 lakh.</li>
        <li>Standard deduction of ₹75,000 for salaried individuals and pensioners.</li>
        <li>A rebate of up to ₹60,000 means no tax on taxable income up to ₹12 lakh. For a salaried person, that is a salary of about ₹12.75 lakh. The rebate does not apply to income taxed at special rates, such as some capital gains.</li>
        <li>Most deductions such as 80C, 80D and HRA are not available.</li>
      </ul>
      <h4>Old regime</h4>
      <ul>
        <li>Nil tax up to ₹2.5 lakh, then 5% (₹2.5–5 lakh), 20% (₹5–10 lakh) and 30% above ₹10 lakh (for individuals below 60).</li>
        <li>Standard deduction of ₹50,000 for salaried individuals.</li>
        <li>Allows deductions and exemptions such as HRA, home loan interest and investments.</li>
        <li>The rebate is only up to ₹12,500, so tax is nil only up to ₹5 lakh of taxable income.</li>
      </ul>
      <h4>How to decide</h4>
      <p>If your deductions and exemptions are large (for example a home loan, high HRA and full investments), compare both regimes, because the old regime can still win. If you claim very little, the new regime is usually cheaper. Salaried people can choose again each year. People with business income have limits on switching, so please ask us before you decide.</p>
      <p><small>From 1 April 2026 the Income-tax Act, 2025 has replaced the 1961 Act, so section numbers have changed. The rates above did not. Last verified: October 2026. Tax rules can change, so please confirm before you act.</small></p>`
  },
  gst: {
    title: "5 Common GST Filing Mistakes Small Businesses Should Avoid",
    wa: "Hello, I want help to make sure my GST filing is correct.",
    html: `
      <p>Small errors in GST returns can lead to notices, interest and blocked credit. These are the five we see most often.</p>
      <ul>
        <li><b>Mismatch between GSTR-1 and GSTR-3B.</b> Outward supplies in GSTR-3B come from GSTR-1, so fix GSTR-1 first and then check the tax you pay in GSTR-3B.</li>
        <li><b>Claiming input tax credit that is not in GSTR-2B.</b> Claim credit only for invoices that appear in your GSTR-2B, which means your supplier has reported them.</li>
        <li><b>Wrong GSTIN, HSN/SAC code or tax rate on invoices.</b> After the September 2025 rate changes, most goods and services are at 5% or 18%, with 40% for a few items. Old rates often stay in billing software, so please check.</li>
        <li><b>Filing late.</b> The late fee is ₹50 a day (₹20 a day for a nil return), subject to a cap that depends on your turnover. Interest at 18% a year is charged on tax paid late. Nil returns must be filed too.</li>
        <li><b>Leaving returns pending for long.</b> Notices have reply deadlines, and the GST portal does not accept GSTR-3B or GSTR-1 more than three years after the due date. Long non-filing can also lead to cancellation of registration.</li>
      </ul>
      <h4>A simple habit</h4>
      <p>Reconcile your purchase register with GSTR-2B every month before filing GSTR-3B. It catches most of these problems early.</p>
      <p><small>Last verified: October 2026. GST rules and due dates can change, so please confirm before you act.</small></p>`
  },
  structure: {
    title: "Private Limited or LLP: Which Structure Fits Your Business?",
    wa: "Hello, I need advice on Private Limited vs LLP for my business.",
    html: `
      <p>Both structures give you limited liability and a separate legal identity. The difference is in funding, compliance and tax.</p>
      <h4>Private Limited Company</h4>
      <ul>
        <li>Needs at least two directors and two shareholders, and can have up to 200 shareholders.</li>
        <li>Can issue shares, so it suits businesses that want investors or employee stock options.</li>
        <li>A statutory audit and annual ROC filings are compulsory every year, whatever the turnover.</li>
        <li>Can opt for concessional company tax rates (22% or 25%, subject to conditions). Dividends are then taxed again in the shareholder's hands.</li>
      </ul>
      <h4>Limited Liability Partnership (LLP)</h4>
      <ul>
        <li>Needs at least two partners, with no minimum capital contribution.</li>
        <li>Lighter compliance and lower running cost, which suits professionals and small family businesses.</li>
        <li>Audit is required only if turnover is above ₹40 lakh or the contribution is above ₹25 lakh.</li>
        <li>Taxed at a flat 30% (plus surcharge and cess), and cannot issue shares, so equity funding is harder.</li>
      </ul>
      <h4>Which one to pick</h4>
      <p>Choose a Private Limited Company if you expect investors, ESOPs or fast scaling. Choose an LLP if you want simpler compliance and no outside equity. Tax and compliance costs depend on your numbers, so please talk to us before deciding.</p>
      <p><small>Last verified: October 2026. Thresholds and rates can change, so please confirm before you act.</small></p>`
  },
  privacy: {
    title: "Privacy Policy",
    wa: "Hello, I have a question about your privacy policy.",
    html: `
      <p>Harshit Dudeja &amp; Co. respects your privacy. This page explains in simple words what we do with the information you share on this website.</p>
      <h4>What we collect</h4>
      <p>Only what you type into the query form: your name, phone number, email (optional), the service you need and your message.</p>
      <h4>How we use it</h4>
      <p>We use it only to reply to your query and to provide the service you ask for. We do not sell or share your details with third parties for marketing.</p>
      <h4>How it reaches us</h4>
      <p>The query form prepares a message that opens in WhatsApp, and you press Send. If email delivery is switched on, the form sends your query to our email through our own secure server. If you choose WhatsApp or phone, your conversation is handled through those apps under their own privacy terms.</p>
      <h4>Cookies and tracking</h4>
      <p>This website does not use advertising cookies. The embedded map and fonts are loaded from Google and follow Google's privacy policy.</p>
      <h4>Contact</h4>
      <p>To ask us to delete your details, email harshitdudeja.co@gmail.com.</p>`
  }
};

const modal = $("#modal");
function openArticle(key) {
  const a = ARTICLES[key];
  if (!a) return;
  $("#modalTitle").textContent = a.title;
  $("#modalBody").innerHTML = a.html;
  const wa = $("#modalWa");
  wa.href = waLink(a.wa);
  wa.hidden = key === "privacy";
  modal.showModal();
  $(".modal-inner", modal).scrollTop = 0;
}
$$("[data-article]").forEach((b) => b.addEventListener("click", () => openArticle(b.dataset.article)));
$("#modalClose").addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

/* =========================================================
   QUERY FORM
   - Opens WhatsApp with the query pre-filled (no keys or secrets in this file)
   - If CONFIG.formEndpoint is set, sends to your own secure server instead
   ========================================================= */
const form = $("#queryForm");
const statusEl = $("#formStatus");

function setError(id, msg) {
  const input = $("#" + id);
  const field = input.closest(".field");
  field.classList.toggle("invalid", !!msg);
  $(`.error[data-for="${id}"]`).textContent = msg || "";
}

function cleanPhone(raw) {
  let p = raw.replace(/[\s\-()]/g, "");
  p = p.replace(/^(\+?91|0)/, "");
  return p;
}

function validate() {
  let ok = true;
  const name = $("#qName").value.trim();
  const phone = cleanPhone($("#qPhone").value);
  const email = $("#qEmail").value.trim();
  const service = $("#qService").value;
  const msg = $("#qMessage").value.trim();

  if (name.length < 2) { setError("qName", "Please enter your full name."); ok = false; } else setError("qName");
  if (!/^[6-9]\d{9}$/.test(phone)) { setError("qPhone", "Enter a valid 10-digit mobile number."); ok = false; } else setError("qPhone");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError("qEmail", "Enter a valid email address."); ok = false; } else setError("qEmail");
  if (!service) { setError("qService", "Please select a service."); ok = false; } else setError("qService");
  if (msg.length < 5) { setError("qMessage", "Please describe your query briefly."); ok = false; } else setError("qMessage");

  return ok ? { name, phone, email, service, message: msg } : null;
}

function showStatus(type, text) {
  statusEl.className = "form-status " + type;
  statusEl.textContent = text;
}

["qName", "qPhone", "qEmail", "qService", "qMessage"].forEach((id) =>
  $("#" + id).addEventListener("input", () => setError(id)));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.className = "form-status"; statusEl.textContent = "";
  const data = validate();
  if (!data) return;
  if (form.elements.botcheck && form.elements.botcheck.checked) return;               // spam trap

  const toWhatsApp = () => {
    const text = `Hello, I am ${data.name}.\nService: ${data.service}\nPhone: ${data.phone}\n${data.email ? "Email: " + data.email + "\n" : ""}Query: ${data.message}`;
    window.open(waLink(text), "_blank", "noopener,noreferrer");
    showStatus("ok", "Thank you! Your query is ready on WhatsApp. Please press Send there and we will contact you shortly.");
  };
  if (!CONFIG.formEndpoint) { toWhatsApp(); return; }

  const btn = $("#qSubmit"), btnText = $("#qSubmitText");
  btn.disabled = true; btnText.textContent = "Sending...";
  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, phone: data.phone, email: data.email, service: data.service, message: data.message }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error("Request failed");
    form.reset();
    showStatus("ok", "Thank you! We have received your query and will contact you shortly.");
  } catch (err) {
    showStatus("err", "Sorry, we could not send your query. Please message us on WhatsApp or call +91 80109 17581.");
  } finally {
    btn.disabled = false; btnText.textContent = "Submit Query";
  }
});


/* =========================================================
   PRACTICE AREA DETAILS (opens in the same popup)
   ========================================================= */
const SERVICE_DETAILS = {
  "GST & Indirect Tax": {
    "who": "Businesses registered under GST or required to register, and anyone who has received a GST notice or show cause notice."
  },
  "Income Tax & Direct Tax": {
    "who": "Individuals, firms, companies and trusts, including anyone who has received an income tax notice."
  },
  "Statutory & Tax Audit": {
    "who": "Companies, firms and organisations that need a statutory or tax audit, or want an independent review of their financials."
  },
  "Financial Reporting & Accounting": {
    "who": "Businesses that want reliable books and reports for management, lenders or investors."
  },
  "Startups & SMEs": {
    "who": "Founders, startups and small and medium businesses that are setting up or growing."
  },
  "NGOs, Trusts & Non-Profits": {
    "who": "Trusts, societies, Section 8 companies and other non-profit organisations."
  },
  "Cross-Border & FEMA Compliance": {
    "who": "Businesses and individuals making or receiving payments across borders."
  }
};

$$(".service").forEach((card) => {
  const title = $("h3", card).textContent.trim();
  const d = SERVICE_DETAILS[title];
  if (!d) return;
  const key = "svc-" + title.toLowerCase().replace(/[^a-z]+/g, "-");
  ARTICLES[key] = {
    title,
    wa: `Hello, I want to know more about: ${title}.`,
    html: `<h4>Who it is for</h4><p>${d.who}</p>
           `
  };
  const box = document.createElement("div");
  box.className = "svc-detail";
  box.innerHTML = ARTICLES[key].html;
  card.insertBefore(box, $("a.link-blue", card));
});

/* =========================================================
   GALLERY: add photos here. The Gallery section and menu
   link stay hidden until this list has at least one photo.
   Example: { src: "images/office-1.jpg", caption: "Our office" }
   ========================================================= */
const GALLERY = [];

if (GALLERY.length) {
  $("#galleryGrid").innerHTML = GALLERY.map((g) =>
    `<figure><img src="${g.src}" alt="${g.caption || "Photo"}" loading="lazy">${g.caption ? `<figcaption>${g.caption}</figcaption>` : ""}</figure>`).join("");
  $("#gallery").hidden = false;
  $("#navGallery").hidden = false;
}


/* =========================================================
   MULTI-PAGE: inline articles, privacy page, active menu link
   ========================================================= */
const articleList = $("#articleList");
if (articleList.isConnected) {
  ["regime", "gst", "structure"].forEach((k) => {
    const a = ARTICLES[k];
    articleList.insertAdjacentHTML("beforeend",
      `<article class="card long-article" id="${k}"><h2>${a.title}</h2>${a.html}<a class="btn btn-wa" href="${waLink(a.wa)}" target="_blank" rel="noopener"><svg class="i"><use href="#i-whatsapp"/></svg> Ask us about this</a></article>`);
  });
}
const policyBody = $("#policyBody");
if (policyBody.isConnected) policyBody.innerHTML = ARTICLES.privacy.html;

const here = (location.pathname.split("/").pop() || "index.html");
$$(".menu a[href]").forEach((a) => {
  const href = a.getAttribute("href");
  if (href === here) a.setAttribute("aria-current", "page");
});
$$(".has-sub").forEach((li) => {
  if (here !== "index.html" && $$(".sub a", li).some((a) => a.getAttribute("href").split("#")[0] === here)) $(".sub-toggle", li).classList.add("current");
});
