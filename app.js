/**
 * Berkeley KPI Agent - v2.0 Production Freeze
 * Complete Enterprise Facilities Management KPI Solution
 * Features:
 *  1. Performance Dashboard as #1 Landing View with reactive site/month/year analytics & 12-month annual timeline chart
 *  2. Site Logo & Berkeley Brand Logo customization (Base64 file upload + URL)
 *  3. Interactive Questionnaire Builder with site cloning, section creation/editing, and KPI question management
 *  4. KPI Register with exact status naming ("Under Review - Berkeley", "Under Review - Client", "Approved & Freezed") and comprehensive Audit Log with diffs
 *  5. Super Admin user editing with Active/Inactive account toggle
 *  6. Top-Right User Session Switcher
 *  7. Automated Corporate Email / Memo Notification System
 */

// Application State
let app = {
  activeSiteId: "site-yam",
  activeMonth: "2026-09",
  activeYear: "2026",
  currentUserId: "usr-superadmin",
  activeNav: "dashboard", // Default to Dashboard as #1

  // Master Data
  monthlyRecords: {},
  siteTemplates: {},
  users: [],
  branding: {
    berkleyLogo: "assets/berkeley-logo.png"
  },
  notifications: []
};

// Current system date constraints
const CURRENT_DATE = new Date();
const CURRENT_YEAR_MONTH = CURRENT_DATE.toISOString().slice(0, 7);

document.addEventListener("DOMContentLoaded", () => {
  loadStorageData();
  validateActiveUserAndSite();
  renderSidebar();
  renderHeaderControls();
  renderActiveView();
  setupEventListeners();
  updateNotificationBadge();
});

// -------------------------------------------------------------
// STORAGE & DATA PERSISTENCE
// -------------------------------------------------------------
function loadStorageData() {
  // Purge legacy storage keys from early prototypes
  try {
    localStorage.removeItem("berkley_kpi_monthly_records");
    localStorage.removeItem("berkley_kpi_site_templates");
    localStorage.removeItem("berkley_kpi_users");
    localStorage.removeItem("berkley_kpi_doc_archive");
    localStorage.removeItem("berkley_custom_templates");
    localStorage.removeItem("berkley_kpi_history");
  } catch (e) {}

  const records = localStorage.getItem("berkeley_kpi_monthly_records");
  if (records) {
    try { app.monthlyRecords = JSON.parse(records); } catch (e) { app.monthlyRecords = {}; }
  } else {
    app.monthlyRecords = {};
  }

  const sites = localStorage.getItem("berkeley_kpi_site_templates");
  if (sites) {
    try { app.siteTemplates = JSON.parse(sites); } catch (e) { app.siteTemplates = {}; }
  }
  if (!app.siteTemplates || Object.keys(app.siteTemplates).length === 0 || !app.siteTemplates["site-yam"] || !app.siteTemplates["site-yam"].categories) {
    app.siteTemplates = JSON.parse(JSON.stringify(INITIAL_SITES));
    saveToStorage();
  }

  const users = localStorage.getItem("berkeley_kpi_users");
  if (users) {
    try { app.users = JSON.parse(users); } catch (e) { app.users = []; }
  }
  if (!Array.isArray(app.users) || app.users.length === 0 || !app.users.some(u => u.role === USER_ROLES.SUPER_ADMIN)) {
    app.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    saveToStorage();
  }

  // Ensure every user has isActive
  app.users.forEach(u => {
    if (u.isActive === undefined) u.isActive = true;
  });

  const branding = localStorage.getItem("berkeley_kpi_branding");
  if (branding) {
    try { app.branding = JSON.parse(branding); } catch (e) { app.branding = { berkleyLogo: "assets/berkeley-logo.png" }; }
  }

  const notifs = localStorage.getItem("berkeley_kpi_notifications");
  if (notifs) {
    try { app.notifications = JSON.parse(notifs); } catch (e) { app.notifications = []; }
  } else {
    app.notifications = [];
  }
}

function saveToStorage() {
  try {
    localStorage.setItem("berkeley_kpi_monthly_records", JSON.stringify(app.monthlyRecords));
    localStorage.setItem("berkeley_kpi_site_templates", JSON.stringify(app.siteTemplates));
    localStorage.setItem("berkeley_kpi_users", JSON.stringify(app.users));
    localStorage.setItem("berkeley_kpi_branding", JSON.stringify(app.branding));
    localStorage.setItem("berkeley_kpi_notifications", JSON.stringify(app.notifications));
  } catch (e) {
    console.error("Failed to persist data:", e);
  }
}

// -------------------------------------------------------------
// USER & PERMISSION HELPERS
// -------------------------------------------------------------
function getCurrentUser() {
  if (!Array.isArray(app.users) || app.users.length === 0) {
    return INITIAL_USERS[0];
  }
  const found = app.users.find(u => u.id === app.currentUserId && u.isActive !== false);
  if (found) return found;
  const anyActive = app.users.find(u => u.isActive !== false);
  return anyActive || app.users[0] || INITIAL_USERS[0];
}

function getCurrentTemplate() {
  if (app.siteTemplates && app.siteTemplates[app.activeSiteId]) {
    return app.siteTemplates[app.activeSiteId];
  }
  if (app.siteTemplates && Object.keys(app.siteTemplates).length > 0) {
    const firstKey = Object.keys(app.siteTemplates)[0];
    app.activeSiteId = firstKey;
    return app.siteTemplates[firstKey];
  }
  return INITIAL_SITES["site-yam"];
}

function getAvailableSitesForCurrentUser() {
  const user = getCurrentUser();
  const allSites = Object.values(app.siteTemplates || INITIAL_SITES);
  if (!user || user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.ADMIN || (user.assignedSiteIds && user.assignedSiteIds.includes("all"))) {
    return allSites;
  }
  const allowed = Array.isArray(user.assignedSiteIds) ? user.assignedSiteIds : [];
  const filtered = allSites.filter(s => allowed.includes(s.siteId));
  return filtered.length > 0 ? filtered : allSites;
}

function validateActiveUserAndSite() {
  const allowedSites = getAvailableSitesForCurrentUser();
  if (allowedSites.length === 0) {
    app.activeSiteId = Object.keys(app.siteTemplates)[0] || "site-yam";
  } else {
    const isCurrentAllowed = allowedSites.some(s => s.siteId === app.activeSiteId);
    if (!isCurrentAllowed) {
      app.activeSiteId = allowedSites[0].siteId;
    }
  }
}

function getRecordKey(siteId, month) {
  return `${siteId}_${month}`;
}

function getActiveRecord() {
  return app.monthlyRecords[getRecordKey(app.activeSiteId, app.activeMonth)] || null;
}

// Normalize legacy statuses to exact requested strings
function normalizeStatus(st) {
  if (st === "under_berkeley" || st === "Under Review - Berkeley") return KPI_STATUS.UNDER_BERKELEY;
  if (st === "under_client" || st === "Under Review - Client") return KPI_STATUS.UNDER_CLIENT;
  if (st === "freezed" || st === "Approved & Freezed") return KPI_STATUS.FREEZED;
  return KPI_STATUS.DRAFT;
}

// -------------------------------------------------------------
// UI SHELL & HEADER CONTROLS
// -------------------------------------------------------------
function renderSidebar() {
  document.querySelectorAll(".sidebar-nav-btn").forEach(btn => {
    const nav = btn.getAttribute("data-nav");
    if (nav === app.activeNav) {
      btn.className = "sidebar-nav-btn w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#2E3092] text-white shadow-md transition-all";
    } else {
      btn.className = "sidebar-nav-btn w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all";
    }
  });

  const logoEl = document.getElementById("sidebar-berkeley-logo");
  if (logoEl && app.branding && app.branding.berkleyLogo) {
    logoEl.src = app.branding.berkleyLogo;
  }
}

function renderHeaderControls() {
  const allowedSites = getAvailableSitesForCurrentUser();
  const siteSelect = document.getElementById("header-site-select");
  if (siteSelect) {
    siteSelect.innerHTML = allowedSites.map(s => 
      `<option value="${s.siteId}" ${s.siteId === app.activeSiteId ? "selected" : ""}>${s.siteName} (${s.clientName})</option>`
    ).join("");
  }

  const monthInput = document.getElementById("header-month-select");
  if (monthInput) {
    monthInput.value = app.activeMonth;
    monthInput.setAttribute("max", CURRENT_YEAR_MONTH);
  }

  const yearSelect = document.getElementById("header-year-select");
  if (yearSelect) {
    yearSelect.value = app.activeYear || "2026";
  }

  // Render Top-Right User Switcher
  const userSwitcherContainer = document.getElementById("header-user-switcher-container");
  if (userSwitcherContainer) {
    const user = getCurrentUser();
    const roleColor = user.role === USER_ROLES.SUPER_ADMIN ? "bg-[#BE1E2D]" : 
                     (user.role === USER_ROLES.ADMIN ? "bg-[#2E3092]" : 
                     (user.role === USER_ROLES.FACILITY_ENGINEER ? "bg-[#006738]" : "bg-[#FBAF3F] text-slate-950"));

    userSwitcherContainer.innerHTML = `
      <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${roleColor}">
        ${user.avatar || user.name.slice(0, 2).toUpperCase()}
      </div>
      <div class="hidden sm:block text-left pr-1">
        <div class="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[120px]">${user.name}</div>
        <div class="text-[9px] font-semibold text-slate-500 leading-tight">${user.role}</div>
      </div>
      <select id="header-user-switch-select" class="bg-white border border-slate-300 rounded-lg py-1 px-1.5 text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-[#2E3092]">
        ${app.users.map(u => `
          <option value="${u.id}" ${u.id === user.id ? "selected" : ""} ${u.isActive === false ? "disabled" : ""}>
            ${u.name} (${u.role})${u.isActive === false ? " [Inactive]" : ""}
          </option>
        `).join("")}
      </select>
    `;

    const selectEl = document.getElementById("header-user-switch-select");
    if (selectEl) {
      selectEl.addEventListener("change", (e) => {
        app.currentUserId = e.target.value;
        validateActiveUserAndSite();
        renderHeaderControls();
        renderActiveView();
        const u = getCurrentUser();
        showToast(`Active User Switched: ${u.name} (${u.role})`, "info");
      });
    }
  }
}

function renderActiveView() {
  const vDashboard = document.getElementById("view-dashboard");
  const vEval = document.getElementById("view-evaluation");
  const vRegister = document.getElementById("view-register");
  const vSites = document.getElementById("view-sites");
  const vUsers = document.getElementById("view-users");

  if (vDashboard) vDashboard.classList.toggle("hidden", app.activeNav !== "dashboard");
  if (vEval) vEval.classList.toggle("hidden", app.activeNav !== "evaluation");
  if (vRegister) vRegister.classList.toggle("hidden", app.activeNav !== "register");
  if (vSites) vSites.classList.toggle("hidden", app.activeNav !== "sites");
  if (vUsers) vUsers.classList.toggle("hidden", app.activeNav !== "users");

  if (app.activeNav === "dashboard") {
    renderDashboardView();
  } else if (app.activeNav === "evaluation") {
    renderEvaluationView();
  } else if (app.activeNav === "register") {
    renderRegisterView();
  } else if (app.activeNav === "sites") {
    renderSitesView();
  } else if (app.activeNav === "users") {
    renderUsersView();
  }
}

function setupEventListeners() {
  document.querySelectorAll(".sidebar-nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      app.activeNav = btn.getAttribute("data-nav");
      renderSidebar();
      renderActiveView();
    });
  });

  const siteSelect = document.getElementById("header-site-select");
  if (siteSelect) {
    siteSelect.addEventListener("change", (e) => {
      app.activeSiteId = e.target.value;
      renderActiveView();
    });
  }

  const monthInput = document.getElementById("header-month-select");
  if (monthInput) {
    monthInput.addEventListener("change", (e) => {
      const selected = e.target.value;
      if (selected > CURRENT_YEAR_MONTH) {
        showToast("⚠️ Future months cannot be evaluated. Please select a past or current period.", "error");
        e.target.value = app.activeMonth;
        return;
      }
      app.activeMonth = selected;
      app.activeYear = selected.split("-")[0];
      const ySelect = document.getElementById("header-year-select");
      if (ySelect) ySelect.value = app.activeYear;
      renderActiveView();
    });
  }

  const yearSelect = document.getElementById("header-year-select");
  if (yearSelect) {
    yearSelect.addEventListener("change", (e) => {
      app.activeYear = e.target.value;
      renderActiveView();
    });
  }

  const btnExcel = document.getElementById("btn-header-excel");
  if (btnExcel) {
    btnExcel.addEventListener("click", () => {
      const record = getActiveRecord();
      if (!record) {
        showToast("No active record for this site and month to export.", "error");
        return;
      }
      ExcelExporter.exportMonthlyKpiExcel(record, getCurrentTemplate());
      showToast("Downloaded official Berkeley KPI Excel report!", "success");
    });
  }

  const btnPrint = document.getElementById("btn-header-print");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => window.print());
  }

  // Setup Logo File Readers in Modals
  const siteLogoFileInput = document.getElementById("input-site-logo-file");
  if (siteLogoFileInput) {
    siteLogoFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById("input-site-logo-base64").value = ev.target.result;
          const preview = document.getElementById("site-logo-preview-box");
          if (preview) preview.innerHTML = `<img src="${ev.target.result}" class="max-h-full max-w-full object-contain">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const siteLogoUrlInput = document.getElementById("input-site-logo-url");
  if (siteLogoUrlInput) {
    siteLogoUrlInput.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      if (url) {
        document.getElementById("input-site-logo-base64").value = url;
        const preview = document.getElementById("site-logo-preview-box");
        if (preview) preview.innerHTML = `<img src="${url}" class="max-h-full max-w-full object-contain">`;
      }
    });
  }

  const berkeleyLogoFileInput = document.getElementById("input-berkeley-logo-file");
  if (berkeleyLogoFileInput) {
    berkeleyLogoFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const preview = document.getElementById("modal-berkeley-logo-preview");
          if (preview) preview.src = ev.target.result;
          app.branding.tempLogo = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// -------------------------------------------------------------
// MODULE 1: PERFORMANCE DASHBOARD (#1 LANDING VIEW)
// -------------------------------------------------------------
function renderDashboardView() {
  const container = document.getElementById("dashboard-main-container");
  if (!container) return;

  const template = getCurrentTemplate();
  const record = getActiveRecord();
  const selectedYear = app.activeYear || "2026";
  const maxScore = template.maxTotalScore || 100;

  // Active Month Score Metrics
  let currentFinal = 0;
  let currentClient = 0;
  let currentBerkeley = 0;
  let currentStatus = "Not Evaluated";

  if (record) {
    currentStatus = normalizeStatus(record.status);
    currentFinal = calculateScoreTotal(record, "final");
    currentClient = calculateScoreTotal(record, "client");
    currentBerkeley = calculateScoreTotal(record, "berkeley");
  }

  const currentPct = ((currentFinal / maxScore) * 100).toFixed(1);

  // Calculate 12-Month Year Data for Selected Site
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearMonthlyData = [];
  let annualTotalScore = 0;
  let annualEvaluatedCount = 0;

  for (let m = 1; m <= 12; m++) {
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ym = `${selectedYear}-${mm}`;
    const rec = app.monthlyRecords[getRecordKey(template.siteId, ym)];
    
    if (rec) {
      const fin = calculateScoreTotal(rec, "final");
      const cli = calculateScoreTotal(rec, "client");
      const ber = calculateScoreTotal(rec, "berkeley");
      const st = normalizeStatus(rec.status);
      yearMonthlyData.push({
        monthKey: ym,
        label: monthNames[m - 1],
        hasRecord: true,
        finalScore: fin,
        clientScore: cli,
        berkeleyScore: ber,
        pct: Number(((fin / maxScore) * 100).toFixed(1)),
        status: st
      });
      annualTotalScore += fin;
      annualEvaluatedCount++;
    } else {
      yearMonthlyData.push({
        monthKey: ym,
        label: monthNames[m - 1],
        hasRecord: false,
        finalScore: 0,
        clientScore: 0,
        berkeleyScore: 0,
        pct: 0,
        status: "None"
      });
    }
  }

  const annualAvgScore = annualEvaluatedCount > 0 ? (annualTotalScore / annualEvaluatedCount).toFixed(1) : "N/A";
  const annualAvgPct = annualEvaluatedCount > 0 ? ((annualTotalScore / (annualEvaluatedCount * maxScore)) * 100).toFixed(1) : 0;

  container.innerHTML = `
    <!-- Dashboard Header -->
    <div class="bg-gradient-to-r from-slate-900 via-[#2E3092] to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center space-x-4">
        ${template.clientLogo ? `
          <div class="w-14 h-14 bg-white p-2 rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <img src="${template.clientLogo}" alt="${template.clientName}" class="max-h-full max-w-full object-contain">
          </div>
        ` : `
          <div class="w-14 h-14 bg-white/10 p-3 rounded-xl border border-white/20 flex items-center justify-center text-2xl text-amber-300 shrink-0">
            <i class="fa-solid fa-chart-line"></i>
          </div>
        `}
        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-xl font-bold">${template.siteName}</h2>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FBAF3F] text-slate-950 uppercase">${template.clientName}</span>
          </div>
          <p class="text-xs text-slate-300 mt-1">
            Performance Intelligence &bull; Monthly Evaluation Cycle: <b class="text-white">${app.activeMonth}</b> &bull; Annual Timeline: <b class="text-amber-300">${selectedYear}</b>
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button onclick="jumpToEvaluation('${template.siteId}', '${app.activeMonth}')" class="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#2E3092] hover:bg-slate-100 shadow-md transition-all flex items-center">
          <i class="fa-solid fa-clipboard-check mr-1.5"></i> Open Monthly Evaluation
        </button>
      </div>
    </div>

    <!-- Metric Score Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- Card 1: Selected Month Final Score -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>${app.activeMonth} Final Score</span>
          <i class="fa-solid fa-trophy text-amber-500 text-sm"></i>
        </div>
        <div class="flex items-baseline space-x-2">
          <div class="text-3xl font-black ${record ? (currentFinal >= 90 ? 'text-[#006738]' : (currentFinal >= 80 ? 'text-[#2E3092]' : 'text-[#BE1E2D]')) : 'text-slate-400'}">
            ${record ? currentFinal : '--'}
          </div>
          <div class="text-xs font-bold text-slate-500">/ ${maxScore} pts</div>
          ${record ? `<span class="text-xs font-bold text-slate-700 font-mono">(${currentPct}%)</span>` : ''}
        </div>
        <div class="text-[11px] font-bold flex items-center">
          <span class="w-2 h-2 rounded-full ${record ? (currentStatus === KPI_STATUS.FREEZED ? 'bg-[#006738]' : 'bg-[#FBAF3F]') : 'bg-slate-300'} mr-1.5"></span>
          <span class="truncate">${currentStatus}</span>
        </div>
      </div>

      <!-- Card 2: Client vs Berkeley Breakdown -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Review Variance</span>
          <i class="fa-solid fa-scale-balanced text-[#2E3092] text-sm"></i>
        </div>
        <div class="flex items-center justify-between text-xs pt-1">
          <span class="text-slate-600 font-semibold">Client Score:</span>
          <span class="font-bold text-[#2E3092]">${record ? `${currentClient} / ${maxScore}` : '--'}</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-600 font-semibold">Berkeley Score:</span>
          <span class="font-bold text-[#006738]">${record ? `${currentBerkeley} / ${maxScore}` : '--'}</span>
        </div>
        <div class="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100 flex justify-between">
          <span>Variance Shift:</span>
          <span class="font-bold ${currentBerkeley - currentClient >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
            ${record ? (currentBerkeley - currentClient >= 0 ? `+${currentBerkeley - currentClient}` : `${currentBerkeley - currentClient}`) : '0'} pts
          </span>
        </div>
      </div>

      <!-- Card 3: Annual Average (${selectedYear}) -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>${selectedYear} Annual Average</span>
          <i class="fa-solid fa-calendar-check text-[#006738] text-sm"></i>
        </div>
        <div class="flex items-baseline space-x-2">
          <div class="text-3xl font-black text-slate-900">${annualAvgScore}</div>
          <div class="text-xs font-bold text-slate-500">/ ${maxScore} pts</div>
          ${annualEvaluatedCount > 0 ? `<span class="text-xs font-bold text-emerald-700 font-mono">(${annualAvgPct}%)</span>` : ''}
        </div>
        <div class="text-[11px] text-slate-500 font-semibold">
          <b>${annualEvaluatedCount}</b> of 12 months evaluated in ${selectedYear}
        </div>
      </div>

      <!-- Card 4: Contract Standard & Questions -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Questionnaire Matrix</span>
          <i class="fa-solid fa-list-check text-slate-600 text-sm"></i>
        </div>
        <div class="text-3xl font-black text-slate-900">${template.categories.reduce((acc, c) => acc + c.kpis.length, 0)}</div>
        <div class="text-[11px] text-slate-500 font-semibold">
          Across <b>${template.categories.length}</b> functional KPI sections
        </div>
      </div>

    </div>

    <!-- PRIMARY FEATURE: Interactive 12-Month Annual Timeline Graph (${selectedYear}) -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 class="text-sm font-bold text-slate-900 flex items-center">
            <i class="fa-solid fa-chart-column mr-2 text-[#2E3092]"></i> ${selectedYear} Monthly KPI Final Score Progression
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Real-time monthly scores for <b>${template.siteName}</b>. Click on any month bar to jump directly into that evaluation.
          </p>
        </div>

        <div class="flex items-center space-x-4 text-xs font-semibold">
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded bg-[#006738]"></span><span>Approved (&ge;90%)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded bg-[#2E3092]"></span><span>Reviewed (80-89%)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded bg-[#FBAF3F]"></span><span>Action Required (&lt;80%)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded bg-slate-200"></span><span>No Record</span></div>
        </div>
      </div>

      <!-- 12-Month Bar Chart Display -->
      <div class="grid grid-cols-6 sm:grid-cols-12 gap-2.5 items-end pt-4 min-h-[200px]">
        ${yearMonthlyData.map(item => {
          const isSelected = item.monthKey === app.activeMonth;
          let barHeight = item.hasRecord ? Math.max(15, Math.min(100, item.pct)) : 8;
          let barColor = !item.hasRecord ? "bg-slate-100 hover:bg-slate-200 border-dashed border border-slate-300" :
                         (item.finalScore >= 90 ? "bg-[#006738] hover:bg-emerald-700" :
                         (item.finalScore >= 80 ? "bg-[#2E3092] hover:bg-blue-900" : "bg-[#BE1E2D] hover:bg-red-800"));
          
          return `
            <div 
              onclick="selectDashboardMonth('${item.monthKey}')" 
              class="flex flex-col items-center cursor-pointer group transition-all"
              title="${item.label} ${selectedYear}: ${item.hasRecord ? `${item.finalScore}/${maxScore} (${item.pct}%) - ${item.status}` : 'No Record'}"
            >
              <!-- Score Label on Top -->
              <div class="text-[10px] font-bold mb-1.5 transition-transform group-hover:-translate-y-1 ${isSelected ? 'text-[#2E3092] scale-110' : 'text-slate-600'}">
                ${item.hasRecord ? `${item.finalScore}` : '-'}
              </div>

              <!-- Bar Pillar -->
              <div class="w-full max-w-[38px] h-36 bg-slate-50 rounded-xl p-1 flex items-end border ${isSelected ? 'border-[#2E3092] ring-2 ring-blue-200 shadow-md' : 'border-slate-200'}">
                <div class="w-full rounded-lg transition-all duration-500 ${barColor}" style="height: ${barHeight}%;"></div>
              </div>

              <!-- Month Label on Bottom -->
              <div class="mt-2 text-center">
                <div class="text-[11px] font-bold ${isSelected ? 'text-[#2E3092] underline font-black' : 'text-slate-700'}">${item.label}</div>
                <div class="text-[9px] text-slate-400 font-mono">${item.monthKey.slice(5)}</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <!-- Category-Wise Performance for Active Month -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900 flex items-center">
            <i class="fa-solid fa-layer-group mr-2 text-[#006738]"></i> Category-Wise Score Breakdown for ${app.activeMonth}
          </h3>
          <p class="text-xs text-slate-500">Individual performance metrics achieved across all contract divisions</p>
        </div>
        <div class="text-xs font-bold text-slate-700">
          ${record ? `Total Achieved: <b class="text-[#2E3092]">${currentFinal}</b> / ${maxScore}` : 'Evaluation Pending'}
        </div>
      </div>

      <div class="space-y-3.5">
        ${template.categories.map(cat => {
          let catScore = 0;
          if (record && record.items) {
            cat.kpis.forEach(k => {
              const it = record.items[k.id];
              if (it) catScore += Number(it.finalScore !== undefined ? it.finalScore : it.clientScore || 0);
            });
          }
          const catPct = cat.maxScore > 0 ? ((catScore / cat.maxScore) * 100).toFixed(0) : 0;
          const isHigh = catPct >= 90;
          const isMed = catPct >= 80 && catPct < 90;

          return `
            <div class="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-all space-y-2">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center space-x-2.5">
                  <span class="w-6 h-6 rounded-lg bg-blue-50 text-[#2E3092] flex items-center justify-center text-xs font-bold"><i class="fa-solid ${cat.icon || 'fa-folder'}"></i></span>
                  <span class="font-bold text-slate-800">${cat.code} - ${cat.name}</span>
                </div>
                <div class="font-bold ${record ? (isHigh ? 'text-[#006738]' : (isMed ? 'text-[#2E3092]' : 'text-amber-700')) : 'text-slate-400'}">
                  ${record ? `${catScore} / ${cat.maxScore} pts (${catPct}%)` : `Max: ${cat.maxScore} pts`}
                </div>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-[#006738]' : (isMed ? 'bg-[#2E3092]' : 'bg-[#FBAF3F]')}" style="width: ${record ? catPct : 0}%"></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function selectDashboardMonth(monthKey) {
  if (monthKey > CURRENT_YEAR_MONTH) {
    showToast("⚠️ Cannot select future months for KPI evaluation.", "error");
    return;
  }
  app.activeMonth = monthKey;
  const monthInput = document.getElementById("header-month-select");
  if (monthInput) monthInput.value = monthKey;
  renderDashboardView();
  showToast(`Dashboard updated for period: ${monthKey}`, "info");
}

function jumpToEvaluation(siteId, monthKey) {
  app.activeSiteId = siteId;
  app.activeMonth = monthKey;
  app.activeNav = "evaluation";
  renderSidebar();
  renderHeaderControls();
  renderActiveView();
}

// -------------------------------------------------------------
// MODULE 2: MONTHLY EVALUATION WORKFLOW
// -------------------------------------------------------------
function renderEvaluationView() {
  const container = document.getElementById("evaluation-main-container");
  if (!container) return;

  const template = getCurrentTemplate();
  const record = getActiveRecord();
  const user = getCurrentUser();

  // If no record exists for this site & month
  if (!record) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
        ${template.clientLogo ? `
          <div class="w-20 h-20 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto">
            <img src="${template.clientLogo}" alt="${template.clientName}" class="max-h-full max-w-full object-contain">
          </div>
        ` : `
          <div class="w-16 h-16 rounded-2xl bg-blue-50 text-[#2E3092] flex items-center justify-center text-2xl mx-auto border border-blue-100">
            <i class="fa-solid fa-clipboard-question"></i>
          </div>
        `}
        <div>
          <h3 class="text-lg font-bold text-slate-900">No Monthly KPI Record Initiated for ${template.siteName} (${app.activeMonth})</h3>
          <p class="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Every month only one official KPI record is evaluated and reconciled between ${template.clientName} and Berkeley Services UAE.
          </p>
        </div>
        <div class="pt-2">
          ${user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.ADMIN ? `
            <button onclick="createNewMonthlyRecord()" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#2E3092] hover:bg-blue-900 text-white shadow-md transition-all">
              <i class="fa-solid fa-play mr-1.5"></i> Start Monthly Evaluation for ${app.activeMonth}
            </button>
          ` : `
            <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-block">
              Waiting for Client (${template.clientName}) to initiate evaluation for ${app.activeMonth}.
            </span>
          `}
        </div>
      </div>
    `;
    return;
  }

  // Active Record Exists
  const normStatus = normalizeStatus(record.status);
  const isFreezed = normStatus === KPI_STATUS.FREEZED;
  const isUnderBerkeley = normStatus === KPI_STATUS.UNDER_BERKELEY;
  const isUnderClient = normStatus === KPI_STATUS.UNDER_CLIENT;
  const isDraft = normStatus === KPI_STATUS.DRAFT;

  // Score Calculations
  const maxScore = template.maxTotalScore || 100;
  const clientTotal = calculateScoreTotal(record, "client");
  const berkeleyTotal = calculateScoreTotal(record, "berkeley");
  const finalTotal = calculateScoreTotal(record, "final");

  const clientPct = ((clientTotal / maxScore) * 100).toFixed(1);
  const berkeleyPct = ((berkeleyTotal / maxScore) * 100).toFixed(1);
  const finalPct = ((finalTotal / maxScore) * 100).toFixed(1);

  // Status Badge
  let statusBadgeHtml = "";
  if (isFreezed) {
    statusBadgeHtml = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-[#006738]/15 text-[#006738] border border-[#006738]/30 flex items-center"><i class="fa-solid fa-lock mr-1.5"></i> ${KPI_STATUS.FREEZED}</span>`;
  } else if (isUnderBerkeley) {
    statusBadgeHtml = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-[#FBAF3F]/25 text-amber-950 border border-[#FBAF3F]/50 flex items-center"><i class="fa-solid fa-user-clock mr-1.5"></i> ${KPI_STATUS.UNDER_BERKELEY}</span>`;
  } else if (isUnderClient) {
    statusBadgeHtml = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center"><i class="fa-solid fa-user-pen mr-1.5"></i> ${KPI_STATUS.UNDER_CLIENT}</span>`;
  } else {
    statusBadgeHtml = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300 flex items-center"><i class="fa-solid fa-pencil mr-1.5"></i> ${KPI_STATUS.DRAFT}</span>`;
  }

  container.innerHTML = `
    <!-- KPI Header Banner with Logos -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        
        <div class="flex items-center space-x-4">
          <!-- Site Logo & Berkeley Logo Display -->
          <div class="flex items-center space-x-2 shrink-0">
            ${template.clientLogo ? `
              <div class="w-12 h-12 bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                <img src="${template.clientLogo}" alt="${template.clientName}" class="max-h-full max-w-full object-contain">
              </div>
            ` : ''}
            <div class="w-12 h-12 bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
              <img src="${app.branding.berkleyLogo || 'assets/berkeley-logo.png'}" alt="Berkeley" class="max-h-full max-w-full object-contain">
            </div>
          </div>

          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-base font-bold text-slate-900">${template.siteName} &bull; KPI Evaluation Sheet</h2>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">${record.recordId}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Client: <b class="text-slate-800">${template.clientName}</b> &bull; Service Provider: <b class="text-[#2E3092]">Berkeley Services UAE</b> &bull; Cycle: <b class="text-slate-800">${record.month}</b> &bull; Version: <b class="text-[#2E3092] font-mono">${record.currentVersion}</b>
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          ${statusBadgeHtml}
          <button onclick="openAuditLogModal('${record.siteId}', '${record.month}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-sm transition-all flex items-center">
            <i class="fa-solid fa-clock-rotate-left mr-1.5 text-[#2E3092]"></i> Audit Log
          </button>
        </div>
      </div>

      <!-- Live Score Summaries -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
          <div class="text-[10px] font-bold text-[#2E3092] uppercase">Client Initial Score</div>
          <div class="text-2xl font-black text-[#2E3092] mt-0.5">${clientTotal} <span class="text-xs font-bold text-slate-600">/ ${maxScore} (${clientPct}%)</span></div>
        </div>

        <div class="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
          <div class="text-[10px] font-bold text-amber-900 uppercase">Berkeley Reviewed Score</div>
          <div class="text-2xl font-black text-amber-900 mt-0.5">${berkeleyTotal} <span class="text-xs font-bold text-slate-600">/ ${maxScore} (${berkeleyPct}%)</span></div>
        </div>

        <div class="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
          <div class="text-[10px] font-bold text-[#006738] uppercase">Final Agreed Score</div>
          <div class="text-2xl font-black text-[#006738] mt-0.5">${finalTotal} <span class="text-xs font-bold text-slate-600">/ ${maxScore} (${finalPct}%)</span></div>
        </div>
      </div>

      <!-- Action Workflow Buttons Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div class="text-xs text-slate-500">
          Logged in as: <b class="text-slate-900">${user.name}</b> (<span class="font-bold text-[#2E3092]">${user.role}</span>)
        </div>

        <div class="flex flex-wrap items-center space-x-2">
          ${isFreezed ? `
            ${user.role === USER_ROLES.SUPER_ADMIN ? `
              <button onclick="unfreezeCurrentRecord()" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-all">
                <i class="fa-solid fa-unlock mr-1"></i> Super Admin: Unlock Record
              </button>
            ` : `
              <span class="text-xs text-slate-500 font-semibold italic"><i class="fa-solid fa-lock mr-1 text-[#006738]"></i> Record permanently agreed and locked in KPI Register.</span>
            `}
          ` : `
            <!-- Client Actions -->
            ${(user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.SUPER_ADMIN) && (isDraft || isUnderClient) ? `
              <button onclick="handleClientSubmitForReview()" class="px-4 py-2 rounded-xl text-xs font-bold bg-[#2E3092] hover:bg-blue-900 text-white shadow-sm transition-all flex items-center">
                <i class="fa-solid fa-paper-plane mr-1.5"></i> Submit to Berkeley for Review
              </button>
            ` : ''}

            ${(user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.SUPER_ADMIN) && isUnderClient ? `
              <button onclick="handleClientApproveAndFreeze()" class="px-4 py-2 rounded-xl text-xs font-bold bg-[#006738] hover:bg-emerald-800 text-white shadow-sm transition-all flex items-center">
                <i class="fa-solid fa-check-double mr-1.5"></i> Approve & Freeze Evaluation
              </button>
            ` : ''}

            <!-- Berkeley Team Actions -->
            ${(user.role === USER_ROLES.FACILITY_ENGINEER || user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN) && isUnderBerkeley ? `
              <button onclick="handleBerkeleySubmitBackToClient()" class="px-4 py-2 rounded-xl text-xs font-bold bg-[#FBAF3F] hover:bg-amber-500 text-slate-950 shadow-sm transition-all flex items-center">
                <i class="fa-solid fa-arrow-rotate-left mr-1.5"></i> Submit Back to Client with Justifications
              </button>
              <button onclick="handleBerkeleyFinalize()" class="px-4 py-2 rounded-xl text-xs font-bold bg-[#006738] hover:bg-emerald-800 text-white shadow-sm transition-all flex items-center">
                <i class="fa-solid fa-handshake mr-1.5"></i> Agree with Client (No Revisions)
              </button>
            ` : ''}
          `}
        </div>
      </div>
    </div>

    <!-- Questionnaire Sections & KPI Rows -->
    <div class="space-y-6">
      ${template.categories.map((cat, catIdx) => renderCategorySection(cat, catIdx, record, isFreezed, user)).join("")}
    </div>
  `;

  // Bind score change and text area events
  setupKpiInputsListeners(record);
}

function renderCategorySection(cat, catIdx, record, isFreezed, user) {
  let catClientTotal = 0;
  let catBerkeleyTotal = 0;
  let catFinalTotal = 0;

  cat.kpis.forEach(k => {
    const item = record.items[k.id] || {};
    catClientTotal += Number(item.clientScore || 0);
    catBerkeleyTotal += Number(item.berkeleyScore !== undefined ? item.berkeleyScore : item.clientScore || 0);
    catFinalTotal += Number(item.finalScore !== undefined ? item.finalScore : item.berkeleyScore || item.clientScore || 0);
  });

  return `
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 rounded-lg bg-blue-600/30 text-amber-300 flex items-center justify-center font-bold text-sm">
            <i class="fa-solid ${cat.icon || 'fa-folder'}"></i>
          </span>
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-amber-300">${cat.code} &bull; ${cat.name}</h3>
            <span class="text-[10px] text-slate-400">Total Section Weightage: <b class="text-white">${cat.maxScore} pts</b></span>
          </div>
        </div>

        <div class="flex items-center space-x-3 text-xs font-bold">
          <div class="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            <span class="text-slate-400">Section Score:</span> <span class="text-emerald-400 font-mono">${catFinalTotal} / ${cat.maxScore}</span>
          </div>
        </div>
      </div>

      <div class="divide-y divide-slate-100">
        ${cat.kpis.map((kpi, kIdx) => renderKpiRow(kpi, kIdx, record, isFreezed, user)).join("")}
      </div>
    </div>
  `;
}

function renderKpiRow(kpi, kIdx, record, isFreezed, user) {
  const item = record.items[kpi.id] || {
    clientScore: kpi.maxScore,
    clientRemarks: "",
    berkeleyScore: kpi.maxScore,
    berkeleyJustification: "",
    berkeleyAttachment: "",
    finalScore: kpi.maxScore
  };

  const isCritical = kpi.classification === "Critical";
  const normStatus = normalizeStatus(record.status);
  const canEditClient = !isFreezed && (user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.SUPER_ADMIN) && (normStatus === KPI_STATUS.DRAFT || normStatus === KPI_STATUS.UNDER_CLIENT);
  const canEditBerkeley = !isFreezed && (user.role === USER_ROLES.FACILITY_ENGINEER || user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN) && normStatus === KPI_STATUS.UNDER_BERKELEY;

  return `
    <div class="p-5 hover:bg-slate-50/70 transition-colors" id="kpi-row-${kpi.id}">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        <!-- Left: Question Scope & Description -->
        <div class="lg:col-span-5 space-y-1.5">
          <div class="flex items-center space-x-2 flex-wrap">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">${kpi.id}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isCritical ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">${kpi.classification}</span>
            <span class="text-xs text-slate-500 font-semibold">Max: <b class="text-slate-800 font-mono">${kpi.maxScore} pts</b></span>
          </div>

          <h4 class="text-xs font-bold text-slate-900">${kpi.title}</h4>
          <p class="text-[11px] text-slate-600 leading-relaxed">${kpi.description}</p>
          <div class="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200">
            <span class="font-bold text-slate-700">Measured By:</span> ${kpi.measurement}
          </div>
        </div>

        <!-- Center: Client Evaluation Input -->
        <div class="lg:col-span-3 bg-blue-50/40 p-3 rounded-xl border border-blue-200 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-[#2E3092]">
            <span><i class="fa-solid fa-user mr-1"></i> Client Score:</span>
            <span class="font-mono">${item.clientScore} / ${kpi.maxScore}</span>
          </div>

          <select 
            data-kpi-id="${kpi.id}" 
            class="kpi-client-score-select w-full bg-white border border-blue-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#2E3092]"
            ${canEditClient ? '' : 'disabled'}
          >
            ${(kpi.options || []).map(opt => `
              <option value="${opt.value}" ${Number(item.clientScore) === opt.value ? "selected" : ""}>
                ${opt.label}
              </option>
            `).join("")}
          </select>

          <textarea 
            data-kpi-id="${kpi.id}"
            class="kpi-client-remarks-input w-full bg-white border border-blue-200 rounded-lg p-2 text-[11px] text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-[#2E3092]"
            rows="2"
            placeholder="Client comments / failure observation..."
            ${canEditClient ? '' : 'disabled'}
          >${item.clientRemarks || ''}</textarea>
        </div>

        <!-- Right: Berkeley Review & Justifications -->
        <div class="lg:col-span-4 bg-amber-50/40 p-3 rounded-xl border border-amber-200 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-amber-900">
            <span><i class="fa-solid fa-screwdriver-wrench mr-1 text-[#006738]"></i> Berkeley Justification:</span>
            <span class="font-mono">Rev: ${item.berkeleyScore !== undefined ? item.berkeleyScore : item.clientScore} / ${kpi.maxScore}</span>
          </div>

          <div class="flex items-center space-x-2">
            <label class="text-[10px] font-bold text-amber-900 shrink-0">Berkeley Score:</label>
            <select 
              data-kpi-id="${kpi.id}" 
              class="kpi-berkeley-score-select flex-1 bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#FBAF3F]"
              ${canEditBerkeley ? '' : 'disabled'}
            >
              ${(kpi.options || []).map(opt => `
                <option value="${opt.value}" ${Number(item.berkeleyScore !== undefined ? item.berkeleyScore : item.clientScore) === opt.value ? "selected" : ""}>
                  ${opt.label}
                </option>
              `).join("")}
            </select>
          </div>

          <textarea 
            data-kpi-id="${kpi.id}"
            class="kpi-berkeley-justification-input w-full bg-white border border-amber-200 rounded-lg p-2 text-[11px] text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-[#FBAF3F]"
            rows="2"
            placeholder="Technical justification, CAFM rectification reference..."
            ${canEditBerkeley ? '' : 'disabled'}
          >${item.berkeleyJustification || ''}</textarea>

          <div class="flex items-center justify-between text-[10px] pt-1 border-t border-amber-200/60">
            <div class="text-slate-500 truncate max-w-[170px]">
              <i class="fa-solid fa-paperclip mr-1"></i>
              <span id="proof-text-${kpi.id}" class="font-mono text-slate-700">${item.berkeleyAttachment || 'No proof attached'}</span>
            </div>
            ${canEditBerkeley ? `
              <button onclick="promptProofAttachment('${kpi.id}')" class="text-amber-800 hover:underline font-bold">
                <i class="fa-solid fa-upload mr-1"></i> Attach Proof
              </button>
            ` : ''}
          </div>
        </div>

      </div>
    </div>
  `;
}

function setupKpiInputsListeners(record) {
  document.querySelectorAll(".kpi-client-score-select").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const kpiId = e.target.getAttribute("data-kpi-id");
      const val = Number(e.target.value);
      if (!record.items[kpiId]) record.items[kpiId] = {};
      record.items[kpiId].clientScore = val;
      if (record.status === KPI_STATUS.DRAFT || record.status === "draft") {
        record.items[kpiId].berkeleyScore = val;
        record.items[kpiId].finalScore = val;
      }
      saveToStorage();
      renderEvaluationView();
    });
  });

  document.querySelectorAll(".kpi-client-remarks-input").forEach(tx => {
    tx.addEventListener("input", (e) => {
      const kpiId = e.target.getAttribute("data-kpi-id");
      if (!record.items[kpiId]) record.items[kpiId] = {};
      record.items[kpiId].clientRemarks = e.target.value;
      saveToStorage();
    });
  });

  document.querySelectorAll(".kpi-berkeley-score-select").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const kpiId = e.target.getAttribute("data-kpi-id");
      const val = Number(e.target.value);
      if (!record.items[kpiId]) record.items[kpiId] = {};
      record.items[kpiId].berkeleyScore = val;
      record.items[kpiId].finalScore = val;
      saveToStorage();
      renderEvaluationView();
    });
  });

  document.querySelectorAll(".kpi-berkeley-justification-input").forEach(tx => {
    tx.addEventListener("input", (e) => {
      const kpiId = e.target.getAttribute("data-kpi-id");
      if (!record.items[kpiId]) record.items[kpiId] = {};
      record.items[kpiId].berkeleyJustification = e.target.value;
      saveToStorage();
    });
  });
}

function promptProofAttachment(kpiId) {
  const record = getActiveRecord();
  if (!record || !record.items[kpiId]) return;
  const current = record.items[kpiId].berkeleyAttachment || "";
  const proof = prompt("Enter CAFM Task ID, Document Reference, or Upload Link:", current || "CAFM-WO-90823-Proof.pdf");
  if (proof !== null) {
    record.items[kpiId].berkeleyAttachment = proof.trim();
    saveToStorage();
    renderEvaluationView();
    showToast(`Proof attached for KPI ${kpiId}`, "success");
  }
}

// -------------------------------------------------------------
// WORKFLOW STATE TRANSITIONS & AUDIT LOGGING
// -------------------------------------------------------------
function createNewMonthlyRecord() {
  const template = getCurrentTemplate();
  const initialItems = {};

  template.categories.forEach(cat => {
    cat.kpis.forEach(k => {
      const val = k.options && k.options[0] ? k.options[0].value : k.maxScore;
      initialItems[k.id] = {
        kpiId: k.id,
        title: k.title,
        maxScore: k.maxScore,
        clientScore: val,
        clientRemarks: "",
        berkeleyScore: val,
        berkeleyJustification: "",
        berkeleyAttachment: "",
        finalScore: val
      };
    });
  });

  const recordId = `REC-${template.siteId.toUpperCase().replace('SITE-', '')}-${app.activeMonth}`;
  const user = getCurrentUser();

  const record = {
    recordId,
    siteId: template.siteId,
    siteName: template.siteName,
    clientName: template.clientName,
    clientLogo: template.clientLogo || "",
    month: app.activeMonth,
    status: KPI_STATUS.DRAFT,
    currentVersion: "v1.0",
    auditLog: [
      {
        version: "v1.0",
        author: user.name,
        role: user.role,
        action: "Initial Monthly Evaluation Created",
        timestamp: new Date().toLocaleString(),
        note: `Evaluation sheet created for ${template.siteName} (${app.activeMonth}).`,
        diffs: []
      }
    ],
    items: initialItems,
    createdAt: new Date().toISOString()
  };

  app.monthlyRecords[getRecordKey(template.siteId, app.activeMonth)] = record;
  saveToStorage();
  renderEvaluationView();
  showToast(`Created official KPI evaluation for ${app.activeMonth}!`, "success");
}

function handleClientSubmitForReview() {
  const record = getActiveRecord();
  if (!record) return;

  const prevVersion = record.currentVersion;
  const nextVer = incrementVersion(record.currentVersion);
  record.currentVersion = nextVer;
  record.status = KPI_STATUS.UNDER_BERKELEY;

  const clientTotal = calculateScoreTotal(record, "client");
  const user = getCurrentUser();

  const auditEntry = {
    version: nextVer,
    author: user.name,
    role: user.role,
    action: `Submitted to Berkeley for Review (${nextVer})`,
    timestamp: new Date().toLocaleString(),
    note: `Client submitted monthly scores (${clientTotal}/100) to Berkeley FM team for review.`,
    diffs: [`Client Total Evaluated: ${clientTotal} pts.`]
  };

  if (!record.auditLog) record.auditLog = [];
  record.auditLog.push(auditEntry);

  // Trigger Notification to Berkeley Team
  addNotification({
    type: "SUBMITTED_TO_BERKELEY",
    title: `KPI Submitted for Berkeley Review: ${record.siteName}`,
    message: `${user.name} (${user.role}) has submitted monthly KPI evaluation for ${record.siteName} (${record.month}) with initial score ${clientTotal}/100.`,
    siteId: record.siteId,
    siteName: record.siteName,
    month: record.month,
    recordId: record.recordId,
    actorName: user.name,
    actorRole: user.role,
    scores: { client: clientTotal, berkeley: calculateScoreTotal(record, "berkeley"), final: calculateScoreTotal(record, "final") }
  });

  saveToStorage();
  renderEvaluationView();
  showToast(`Evaluation successfully submitted to Berkeley Team for review!`, "success");
}

function handleBerkeleySubmitBackToClient() {
  const record = getActiveRecord();
  if (!record) return;

  const nextVer = incrementVersion(record.currentVersion);
  record.currentVersion = nextVer;
  record.status = KPI_STATUS.UNDER_CLIENT;

  const berTotal = calculateScoreTotal(record, "berkeley");
  const cliTotal = calculateScoreTotal(record, "client");
  const user = getCurrentUser();

  // Compute Diffs
  const diffs = [];
  Object.keys(record.items).forEach(k => {
    const it = record.items[k];
    if (it.berkeleyScore !== it.clientScore) {
      diffs.push(`KPI ${k}: Client ${it.clientScore} pts -> Berkeley revised to ${it.berkeleyScore} pts. Justification: "${it.berkeleyJustification || 'None'}"`);
    }
  });

  const auditEntry = {
    version: nextVer,
    author: user.name,
    role: user.role,
    action: `Berkeley Technical Revisions Submitted (${nextVer})`,
    timestamp: new Date().toLocaleString(),
    note: `Berkeley team reviewed scores (${berTotal}/100) and submitted justifications back to Client.`,
    diffs: diffs.length > 0 ? diffs : ["No score adjustments; all client marks concurred."]
  };

  if (!record.auditLog) record.auditLog = [];
  record.auditLog.push(auditEntry);

  // Trigger Notification to Client Lead
  addNotification({
    type: "SUBMITTED_TO_CLIENT",
    title: `Berkeley Justifications Submitted: ${record.siteName}`,
    message: `${user.name} (${user.role}) has completed Berkeley review for ${record.siteName} (${record.month}) with reviewed score ${berTotal}/100 and technical justifications.`,
    siteId: record.siteId,
    siteName: record.siteName,
    month: record.month,
    recordId: record.recordId,
    actorName: user.name,
    actorRole: user.role,
    scores: { client: cliTotal, berkeley: berTotal, final: berTotal }
  });

  saveToStorage();
  renderEvaluationView();
  showToast(`Justifications and revised scores submitted back to Client!`, "success");
}

function handleBerkeleyFinalize() {
  const record = getActiveRecord();
  if (!record) return;

  // Align Berkeley score with client score
  Object.keys(record.items).forEach(k => {
    record.items[k].berkeleyScore = record.items[k].clientScore;
    record.items[k].finalScore = record.items[k].clientScore;
  });

  const nextVer = incrementVersion(record.currentVersion);
  record.currentVersion = nextVer;
  record.status = KPI_STATUS.FREEZED;

  const user = getCurrentUser();
  const finTotal = calculateScoreTotal(record, "final");

  const auditEntry = {
    version: nextVer,
    author: user.name,
    role: user.role,
    action: `Approved & Freezed (Berkeley Concurred)`,
    timestamp: new Date().toLocaleString(),
    note: `Berkeley team agreed with Client score without revisions. Approved & Freezed permanently.`,
    diffs: [`Final Agreed Score: ${finTotal}/100 pts.`]
  };

  if (!record.auditLog) record.auditLog = [];
  record.auditLog.push(auditEntry);

  addNotification({
    type: "APPROVED_AND_FREEZED",
    title: `KPI Mutually Approved & Freezed: ${record.siteName}`,
    message: `KPI evaluation for ${record.siteName} (${record.month}) has been mutually agreed and permanently freezed with final score ${finTotal}/100.`,
    siteId: record.siteId,
    siteName: record.siteName,
    month: record.month,
    recordId: record.recordId,
    actorName: user.name,
    actorRole: user.role,
    scores: { client: finTotal, berkeley: finTotal, final: finTotal }
  });

  saveToStorage();
  renderEvaluationView();
  showToast(`Evaluation agreed and permanently freezed in KPI Register!`, "success");
}

function handleClientApproveAndFreeze() {
  const record = getActiveRecord();
  if (!record) return;

  const nextVer = incrementVersion(record.currentVersion);
  record.currentVersion = nextVer;
  record.status = KPI_STATUS.FREEZED;

  // Align final scores to Berkeley reviewed score
  Object.keys(record.items).forEach(k => {
    record.items[k].finalScore = record.items[k].berkeleyScore !== undefined ? record.items[k].berkeleyScore : record.items[k].clientScore;
  });

  const finTotal = calculateScoreTotal(record, "final");
  const user = getCurrentUser();

  const auditEntry = {
    version: nextVer,
    author: user.name,
    role: user.role,
    action: `Client Approved & Freezed (${nextVer})`,
    timestamp: new Date().toLocaleString(),
    note: `Client accepted justifications and approved final score (${finTotal}/100). Record locked.`,
    diffs: [`Final Mutually Agreed Score: ${finTotal}/100 pts.`]
  };

  if (!record.auditLog) record.auditLog = [];
  record.auditLog.push(auditEntry);

  addNotification({
    type: "APPROVED_AND_FREEZED",
    title: `KPI Approved & Freezed by Client: ${record.siteName}`,
    message: `${user.name} (${user.role}) has approved justifications and permanently freezed the KPI register for ${record.siteName} (${record.month}) with final score ${finTotal}/100.`,
    siteId: record.siteId,
    siteName: record.siteName,
    month: record.month,
    recordId: record.recordId,
    actorName: user.name,
    actorRole: user.role,
    scores: { client: calculateScoreTotal(record, "client"), berkeley: calculateScoreTotal(record, "berkeley"), final: finTotal }
  });

  saveToStorage();
  renderEvaluationView();
  showToast(`KPI permanently approved and locked in Register!`, "success");
}

function unfreezeCurrentRecord() {
  const user = getCurrentUser();
  if (user.role !== USER_ROLES.SUPER_ADMIN) {
    showToast("Only Super Admin can unlock freezed records.", "error");
    return;
  }
  const record = getActiveRecord();
  if (!record) return;

  if (confirm("Super Admin: Unlock this freezed record for revisions?")) {
    record.status = KPI_STATUS.UNDER_CLIENT;
    const nextVer = incrementVersion(record.currentVersion);
    record.currentVersion = nextVer;
    
    if (!record.auditLog) record.auditLog = [];
    record.auditLog.push({
      version: nextVer,
      author: user.name,
      role: user.role,
      action: "Super Admin Unlocked Record",
      timestamp: new Date().toLocaleString(),
      note: "Record unlocked for adjustments.",
      diffs: []
    });

    saveToStorage();
    renderEvaluationView();
    showToast("Record unlocked for editing.", "info");
  }
}

function calculateScoreTotal(record, type = "client") {
  if (!record || !record.items) return 0;
  let total = 0;
  Object.keys(record.items).forEach(k => {
    const item = record.items[k];
    if (type === "client") {
      total += Number(item.clientScore || 0);
    } else if (type === "berkeley") {
      total += Number(item.berkeleyScore !== undefined ? item.berkeleyScore : item.clientScore || 0);
    } else {
      total += Number(item.finalScore !== undefined ? item.finalScore : (item.berkeleyScore !== undefined ? item.berkeleyScore : item.clientScore || 0));
    }
  });
  return total;
}

function incrementVersion(verStr = "v1.0") {
  const num = parseFloat(verStr.replace("v", "")) || 1.0;
  return `v${(num + 0.1).toFixed(1)}`;
}

// -------------------------------------------------------------
// MODULE 3: KPI REGISTER WITH AUDIT TRAIL & TIMELINE FILTER
// -------------------------------------------------------------
function renderRegisterView() {
  const container = document.getElementById("register-main-container");
  if (!container) return;

  const allowedSites = getAvailableSitesForCurrentUser();
  const allowedSiteIds = allowedSites.map(s => s.siteId);

  // Filter records
  const allRecords = Object.values(app.monthlyRecords).filter(r => allowedSiteIds.includes(r.siteId));
  
  // Collect unique years from records + current year
  const yearsSet = new Set(["2026", "2025", "2024"]);
  allRecords.forEach(r => {
    if (r.month) yearsSet.add(r.month.split("-")[0]);
  });
  const yearsList = Array.from(yearsSet).sort().reverse();

  // Active filters in register
  const filterSite = window.registerFilterSite || "all";
  const filterYear = window.registerFilterYear || "all";
  const filterMonth = window.registerFilterMonth || "all";
  const filterStatus = window.registerFilterStatus || "all";

  const filteredRecords = allRecords.filter(r => {
    if (filterSite !== "all" && r.siteId !== filterSite) return false;
    if (filterYear !== "all" && !r.month.startsWith(filterYear)) return false;
    if (filterMonth !== "all" && r.month.split("-")[1] !== filterMonth) return false;
    if (filterStatus !== "all" && normalizeStatus(r.status) !== filterStatus) return false;
    return true;
  });

  // Sort descending by month
  filteredRecords.sort((a, b) => b.month.localeCompare(a.month));

  container.innerHTML = `
    <!-- Register Header & Filters Bar -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900 flex items-center">
            <i class="fa-solid fa-book-bookmark mr-2 text-[#2E3092]"></i> Master KPI Register
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Central repository of monthly evaluations, reconciliation reviews, and permanently freezed sign-offs across contract sites.
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2E3092] border border-blue-200">
            ${filteredRecords.length} Records Found
          </span>
        </div>
      </div>

      <!-- Timeline & Filter Selectors -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Filter Site:</label>
          <select id="reg-filter-site" class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800">
            <option value="all" ${filterSite === 'all' ? 'selected' : ''}>All Assigned Sites</option>
            ${allowedSites.map(s => `<option value="${s.siteId}" ${filterSite === s.siteId ? 'selected' : ''}>${s.siteName}</option>`).join("")}
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Timeline Year:</label>
          <select id="reg-filter-year" class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800">
            <option value="all" ${filterYear === 'all' ? 'selected' : ''}>All Years</option>
            ${yearsList.map(y => `<option value="${y}" ${filterYear === y ? 'selected' : ''}>${y}</option>`).join("")}
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Timeline Month:</label>
          <select id="reg-filter-month" class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800">
            <option value="all" ${filterMonth === 'all' ? 'selected' : ''}>All Months</option>
            ${["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => `
              <option value="${m}" ${filterMonth === m ? 'selected' : ''}>Month ${m}</option>
            `).join("")}
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status:</label>
          <select id="reg-filter-status" class="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800">
            <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="${KPI_STATUS.FREEZED}" ${filterStatus === KPI_STATUS.FREEZED ? 'selected' : ''}>${KPI_STATUS.FREEZED}</option>
            <option value="${KPI_STATUS.UNDER_BERKELEY}" ${filterStatus === KPI_STATUS.UNDER_BERKELEY ? 'selected' : ''}>${KPI_STATUS.UNDER_BERKELEY}</option>
            <option value="${KPI_STATUS.UNDER_CLIENT}" ${filterStatus === KPI_STATUS.UNDER_CLIENT ? 'selected' : ''}>${KPI_STATUS.UNDER_CLIENT}</option>
            <option value="${KPI_STATUS.DRAFT}" ${filterStatus === KPI_STATUS.DRAFT ? 'selected' : ''}>${KPI_STATUS.DRAFT}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Register Table -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
            <tr>
              <th class="py-3 px-4">Record Ref & Site</th>
              <th class="py-3 px-4">Period</th>
              <th class="py-3 px-4">Client Score</th>
              <th class="py-3 px-4">Berkeley Score</th>
              <th class="py-3 px-4">Final Score</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Version</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-semibold text-slate-700">
            ${filteredRecords.length === 0 ? `
              <tr>
                <td colspan="8" class="text-center py-12 text-slate-400">
                  <i class="fa-solid fa-folder-open text-3xl mb-2 block"></i>
                  No KPI evaluations found matching the selected filters.
                </td>
              </tr>
            ` : filteredRecords.map(r => {
              const tmpl = app.siteTemplates[r.siteId] || getCurrentTemplate();
              const maxS = tmpl.maxTotalScore || 100;
              const cliS = calculateScoreTotal(r, "client");
              const berS = calculateScoreTotal(r, "berkeley");
              const finS = calculateScoreTotal(r, "final");
              const finPct = ((finS / maxS) * 100).toFixed(1);
              const normSt = normalizeStatus(r.status);

              let statusBadge = "";
              if (normSt === KPI_STATUS.FREEZED) {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#006738]/15 text-[#006738] border border-[#006738]/30 flex items-center w-fit"><i class="fa-solid fa-lock mr-1"></i> ${KPI_STATUS.FREEZED}</span>`;
              } else if (normSt === KPI_STATUS.UNDER_BERKELEY) {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FBAF3F]/25 text-amber-950 border border-[#FBAF3F]/50 flex items-center w-fit"><i class="fa-solid fa-user-clock mr-1"></i> ${KPI_STATUS.UNDER_BERKELEY}</span>`;
              } else if (normSt === KPI_STATUS.UNDER_CLIENT) {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center w-fit"><i class="fa-solid fa-user-pen mr-1"></i> ${KPI_STATUS.UNDER_CLIENT}</span>`;
              } else {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center w-fit"><i class="fa-solid fa-pencil mr-1"></i> ${KPI_STATUS.DRAFT}</span>`;
              }

              return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4">
                    <div class="flex items-center space-x-2.5">
                      ${tmpl.clientLogo ? `
                        <img src="${tmpl.clientLogo}" class="w-7 h-7 object-contain rounded border border-slate-200 p-0.5 shrink-0">
                      ` : ''}
                      <div>
                        <div class="font-bold text-slate-900">${r.siteName}</div>
                        <div class="text-[10px] text-slate-500 font-mono">${r.recordId}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 font-bold text-slate-800">${r.month}</td>
                  <td class="py-3 px-4 text-[#2E3092] font-mono">${cliS} / ${maxS}</td>
                  <td class="py-3 px-4 text-amber-900 font-mono">${berS} / ${maxS}</td>
                  <td class="py-3 px-4 font-mono font-bold text-[#006738]">${finS} (${finPct}%)</td>
                  <td class="py-3 px-4">${statusBadge}</td>
                  <td class="py-3 px-4 font-mono text-[11px]">${r.currentVersion}</td>
                  <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button onclick="openRecordInEvaluation('${r.siteId}', '${r.month}')" class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2E3092] font-bold" title="Open Evaluation">
                      <i class="fa-solid fa-folder-open mr-1"></i> Open
                    </button>
                    <button onclick="openAuditLogModal('${r.siteId}', '${r.month}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold" title="View Audit Trail">
                      <i class="fa-solid fa-clock-rotate-left mr-1"></i> Log
                    </button>
                    <button onclick="exportSingleRecordExcel('${r.siteId}', '${r.month}')" class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006738] font-bold" title="Export Excel">
                      <i class="fa-solid fa-file-excel"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach filter change listeners
  const sSite = document.getElementById("reg-filter-site");
  if (sSite) sSite.addEventListener("change", (e) => { window.registerFilterSite = e.target.value; renderRegisterView(); });
  const sYear = document.getElementById("reg-filter-year");
  if (sYear) sYear.addEventListener("change", (e) => { window.registerFilterYear = e.target.value; renderRegisterView(); });
  const sMonth = document.getElementById("reg-filter-month");
  if (sMonth) sMonth.addEventListener("change", (e) => { window.registerFilterMonth = e.target.value; renderRegisterView(); });
  const sStatus = document.getElementById("reg-filter-status");
  if (sStatus) sStatus.addEventListener("change", (e) => { window.registerFilterStatus = e.target.value; renderRegisterView(); });
}

function openRecordInEvaluation(siteId, month) {
  app.activeSiteId = siteId;
  app.activeMonth = month;
  app.activeNav = "evaluation";
  validateActiveUserAndSite();
  renderSidebar();
  renderHeaderControls();
  renderActiveView();
}

function exportSingleRecordExcel(siteId, month) {
  const rec = app.monthlyRecords[getRecordKey(siteId, month)];
  const tmpl = app.siteTemplates[siteId] || getCurrentTemplate();
  if (!rec) {
    showToast("Record not found to export.", "error");
    return;
  }
  ExcelExporter.exportMonthlyKpiExcel(rec, tmpl);
  showToast(`Exported ${rec.recordId} to Excel!`, "success");
}

// -------------------------------------------------------------
// MODULE 4: SITES & QUESTIONNAIRE BUILDER & CLONING
// -------------------------------------------------------------
function renderSitesView() {
  const container = document.getElementById("sites-main-container");
  if (!container) return;

  const sites = Object.values(app.siteTemplates || {});
  const user = getCurrentUser();
  const canManage = user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.ADMIN;

  container.innerHTML = `
    <!-- Sites Header -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-base font-bold text-slate-900 flex items-center">
          <i class="fa-solid fa-building mr-2 text-[#2E3092]"></i> Client Sites & KPI Matrices
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Provision contracts, upload client logos, clone templates across sites, and customize sections and scoring rubrics.
        </p>
      </div>

      ${canManage ? `
        <button onclick="openNewSiteModal()" class="px-4 py-2 rounded-xl text-xs font-bold bg-[#2E3092] hover:bg-blue-900 text-white shadow-sm flex items-center transition-all">
          <i class="fa-solid fa-plus mr-1.5"></i> Add New Client Site
        </button>
      ` : ''}
    </div>

    <!-- Sites Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      ${sites.map(s => {
        const totalQuestions = s.categories.reduce((acc, c) => acc + c.kpis.length, 0);
        const maxScore = s.maxTotalScore || 100;
        const isCurrentActive = s.siteId === app.activeSiteId;

        return `
          <div class="bg-white rounded-2xl border ${isCurrentActive ? 'border-[#2E3092] ring-2 ring-blue-100' : 'border-slate-200'} p-6 shadow-sm space-y-4">
            
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3.5">
                ${s.clientLogo ? `
                  <div class="w-14 h-14 rounded-xl border border-slate-200 p-1 flex items-center justify-center bg-white shadow-sm shrink-0">
                    <img src="${s.clientLogo}" alt="${s.clientName}" class="max-h-full max-w-full object-contain">
                  </div>
                ` : `
                  <div class="w-14 h-14 rounded-xl bg-blue-50 text-[#2E3092] flex items-center justify-center text-xl font-bold border border-blue-200 shrink-0">
                    <i class="fa-solid fa-building"></i>
                  </div>
                `}
                <div>
                  <h3 class="text-sm font-bold text-slate-900">${s.siteName}</h3>
                  <div class="text-xs text-slate-500 font-semibold">${s.clientName} &bull; ${s.location}</div>
                  <div class="text-[10px] text-slate-400 font-mono mt-0.5">ID: ${s.siteId}</div>
                </div>
              </div>

              ${isCurrentActive ? `
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2E3092] text-white">Active Site</span>
              ` : ''}
            </div>

            <!-- Stats Bar -->
            <div class="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase">Weightage</div>
                <div class="text-sm font-black text-slate-900">${maxScore} pts</div>
              </div>
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase">Sections</div>
                <div class="text-sm font-black text-slate-900">${s.categories.length}</div>
              </div>
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase">Questions</div>
                <div class="text-sm font-black text-slate-900">${totalQuestions}</div>
              </div>
            </div>

            <!-- Site Actions & Builder Toggle -->
            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div class="flex items-center space-x-2">
                <button onclick="setSiteAndOpen('${s.siteId}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2E3092] text-white hover:bg-blue-900 shadow-sm">
                  Select Site
                </button>
                ${canManage ? `
                  <button onclick="openEditSiteModal('${s.siteId}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700">
                    <i class="fa-solid fa-pen mr-1"></i> Edit / Logo
                  </button>
                  <button onclick="openCloneSiteModal('${s.siteId}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200">
                    <i class="fa-solid fa-copy mr-1"></i> Clone Matrix
                  </button>
                ` : ''}
              </div>

              ${canManage ? `
                <button onclick="openAddSectionModal('${s.siteId}')" class="text-xs font-bold text-[#006738] hover:underline">
                  <i class="fa-solid fa-folder-plus mr-1"></i> Add Section
                </button>
              ` : ''}
            </div>

            <!-- Expandable Questionnaire Structure Preview -->
            <div class="space-y-2 pt-2">
              <div class="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>KPI Questionnaire Breakdown:</span>
                <span class="text-[10px] text-slate-400 font-semibold">${s.categories.length} Divisions</span>
              </div>

              <div class="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                ${s.categories.map(cat => `
                  <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div class="overflow-hidden">
                      <div class="font-bold text-slate-800 truncate">${cat.code} - ${cat.name}</div>
                      <div class="text-[10px] text-slate-500">${cat.kpis.length} questions &bull; ${cat.maxScore} pts</div>
                    </div>
                    ${canManage ? `
                      <div class="flex items-center space-x-1 shrink-0">
                        <button onclick="openAddKpiModal('${s.siteId}', '${cat.id}')" class="p-1 text-slate-600 hover:text-[#006738]" title="Add Question to this section">
                          <i class="fa-solid fa-plus-circle"></i>
                        </button>
                        <button onclick="openEditSectionModal('${s.siteId}', '${cat.id}')" class="p-1 text-slate-600 hover:text-[#2E3092]" title="Edit section">
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="deleteSection('${s.siteId}', '${cat.id}')" class="p-1 text-slate-400 hover:text-red-600" title="Delete section">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    ` : ''}
                  </div>
                `).join("")}
              </div>
            </div>

          </div>
        `;
      }).join("")}
    </div>
  `;
}

function setSiteAndOpen(siteId) {
  app.activeSiteId = siteId;
  validateActiveUserAndSite();
  renderSidebar();
  renderHeaderControls();
  renderActiveView();
  showToast(`Switched active site: ${getCurrentTemplate().siteName}`, "info");
}

function openNewSiteModal() {
  document.getElementById("modal-site-title").innerHTML = `<i class="fa-solid fa-building mr-2 text-[#FBAF3F]"></i> Add New Client Site`;
  document.getElementById("input-edit-site-id").value = "";
  document.getElementById("input-site-name").value = "";
  document.getElementById("input-client-name").value = "";
  document.getElementById("input-site-location").value = "";
  document.getElementById("input-site-logo-url").value = "";
  document.getElementById("input-site-logo-base64").value = "";
  document.getElementById("site-logo-preview-box").innerHTML = `<i class="fa-solid fa-image text-slate-300 text-xl"></i>`;
  document.getElementById("site-template-source-box").classList.remove("hidden");
  document.getElementById("modal-new-site").classList.remove("hidden");
}

function openEditSiteModal(siteId) {
  const s = app.siteTemplates[siteId];
  if (!s) return;
  document.getElementById("modal-site-title").innerHTML = `<i class="fa-solid fa-pen mr-2 text-[#FBAF3F]"></i> Edit Site & Logo`;
  document.getElementById("input-edit-site-id").value = s.siteId;
  document.getElementById("input-site-name").value = s.siteName;
  document.getElementById("input-client-name").value = s.clientName;
  document.getElementById("input-site-location").value = s.location;
  document.getElementById("input-site-logo-url").value = s.clientLogo || "";
  document.getElementById("input-site-logo-base64").value = s.clientLogo || "";
  
  const preview = document.getElementById("site-logo-preview-box");
  if (preview) {
    preview.innerHTML = s.clientLogo ? `<img src="${s.clientLogo}" class="max-h-full max-w-full object-contain">` : `<i class="fa-solid fa-image text-slate-300 text-xl"></i>`;
  }
  document.getElementById("site-template-source-box").classList.add("hidden");
  document.getElementById("modal-new-site").classList.remove("hidden");
}

function closeNewSiteModal() {
  document.getElementById("modal-new-site").classList.add("hidden");
}

function saveNewSiteFromModal() {
  const editId = document.getElementById("input-edit-site-id").value;
  const name = document.getElementById("input-site-name").value.trim();
  const client = document.getElementById("input-client-name").value.trim();
  const location = document.getElementById("input-site-location").value.trim();
  const logo = document.getElementById("input-site-logo-base64").value.trim() || document.getElementById("input-site-logo-url").value.trim();

  if (!name || !client) {
    alert("Please provide Site Name and Client Organization.");
    return;
  }

  if (editId && app.siteTemplates[editId]) {
    // Update existing site
    app.siteTemplates[editId].siteName = name;
    app.siteTemplates[editId].clientName = client;
    app.siteTemplates[editId].location = location;
    app.siteTemplates[editId].clientLogo = logo;
    showToast(`Updated site "${name}"!`, "success");
  } else {
    // Create new site
    const siteId = `site-${Date.now().toString().slice(-4)}`;
    const templateChoice = document.getElementById("input-site-template-source").value;
    const baseCategories = templateChoice === "clone-yam" ? JSON.parse(JSON.stringify(MIRAL_YAM_CATEGORIES)) : [];

    app.siteTemplates[siteId] = {
      siteId,
      siteName: name,
      clientName: client,
      location,
      clientLogo: logo,
      maxTotalScore: baseCategories.reduce((acc, c) => acc + c.maxScore, 0) || 100,
      categories: baseCategories
    };
    app.activeSiteId = siteId;
    showToast(`New Client Site "${name}" created!`, "success");
  }

  saveToStorage();
  closeNewSiteModal();
  renderHeaderControls();
  renderSitesView();
}

// Cloning Questionnaires Across Sites
function openCloneSiteModal(targetSiteId) {
  const targetSite = app.siteTemplates[targetSiteId];
  if (!targetSite) return;
  document.getElementById("input-clone-target-site-id").value = targetSiteId;
  document.getElementById("clone-target-site-name").textContent = targetSite.siteName;

  const select = document.getElementById("select-clone-source-site");
  const otherSites = Object.values(app.siteTemplates).filter(s => s.siteId !== targetSiteId);
  select.innerHTML = otherSites.map(s => `
    <option value="${s.siteId}">${s.siteName} (${s.clientName}) - ${s.categories.length} Sections</option>
  `).join("");

  document.getElementById("modal-clone-site-kpi").classList.remove("hidden");
}

function closeCloneSiteModal() {
  document.getElementById("modal-clone-site-kpi").classList.add("hidden");
}

function executeCloneQuestionnaire() {
  const targetId = document.getElementById("input-clone-target-site-id").value;
  const sourceId = document.getElementById("select-clone-source-site").value;

  if (!targetId || !sourceId || !app.siteTemplates[sourceId] || !app.siteTemplates[targetId]) {
    alert("Please select a valid source site.");
    return;
  }

  const source = app.siteTemplates[sourceId];
  app.siteTemplates[targetId].categories = JSON.parse(JSON.stringify(source.categories));
  app.siteTemplates[targetId].maxTotalScore = source.maxTotalScore;

  saveToStorage();
  closeCloneSiteModal();
  renderSitesView();
  showToast(`Successfully cloned questionnaire from ${source.siteName} into ${app.siteTemplates[targetId].siteName}!`, "success");
}

// Section Management
function openAddSectionModal(siteId) {
  document.getElementById("modal-section-title").innerHTML = `<i class="fa-solid fa-folder-plus mr-2 text-[#FBAF3F]"></i> Add KPI Section`;
  document.getElementById("input-section-site-id").value = siteId;
  document.getElementById("input-section-id").value = "";
  document.getElementById("input-section-code").value = `SS.0${(app.siteTemplates[siteId].categories.length + 1)}`;
  document.getElementById("input-section-max-score").value = "15";
  document.getElementById("input-section-name").value = "";
  document.getElementById("modal-edit-section").classList.remove("hidden");
}

function openEditSectionModal(siteId, catId) {
  const cat = app.siteTemplates[siteId].categories.find(c => c.id === catId);
  if (!cat) return;
  document.getElementById("modal-section-title").innerHTML = `<i class="fa-solid fa-pen-to-square mr-2 text-[#FBAF3F]"></i> Edit KPI Section`;
  document.getElementById("input-section-site-id").value = siteId;
  document.getElementById("input-section-id").value = cat.id;
  document.getElementById("input-section-code").value = cat.code;
  document.getElementById("input-section-max-score").value = cat.maxScore;
  document.getElementById("input-section-name").value = cat.name;
  document.getElementById("modal-edit-section").classList.remove("hidden");
}

function closeEditSectionModal() {
  document.getElementById("modal-edit-section").classList.add("hidden");
}

function saveSectionFromModal() {
  const siteId = document.getElementById("input-section-site-id").value;
  const catId = document.getElementById("input-section-id").value;
  const code = document.getElementById("input-section-code").value.trim();
  const maxScore = Number(document.getElementById("input-section-max-score").value) || 10;
  const name = document.getElementById("input-section-name").value.trim();
  const icon = document.getElementById("input-section-icon").value;

  if (!code || !name) {
    alert("Please enter Section Code and Name.");
    return;
  }

  const site = app.siteTemplates[siteId];
  if (!site) return;

  if (catId) {
    const cat = site.categories.find(c => c.id === catId);
    if (cat) {
      cat.code = code;
      cat.maxScore = maxScore;
      cat.name = name;
      cat.icon = icon;
    }
  } else {
    site.categories.push({
      id: `CAT-${Date.now().toString().slice(-4)}`,
      code,
      name,
      maxScore,
      icon,
      kpis: []
    });
  }

  // Recalculate maxTotalScore
  site.maxTotalScore = site.categories.reduce((acc, c) => acc + c.maxScore, 0);

  saveToStorage();
  closeEditSectionModal();
  renderSitesView();
  showToast(`Section "${code} - ${name}" saved!`, "success");
}

function deleteSection(siteId, catId) {
  if (confirm("Delete this entire section and its questions?")) {
    const site = app.siteTemplates[siteId];
    site.categories = site.categories.filter(c => c.id !== catId);
    site.maxTotalScore = site.categories.reduce((acc, c) => acc + c.maxScore, 0);
    saveToStorage();
    renderSitesView();
    showToast("Section deleted.", "info");
  }
}

// KPI Question Management
function openAddKpiModal(siteId, catId) {
  document.getElementById("modal-kpi-title").innerHTML = `<i class="fa-solid fa-list-check mr-2 text-[#FBAF3F]"></i> Add KPI Question`;
  document.getElementById("input-kpi-site-id").value = siteId;
  document.getElementById("input-kpi-section-id").value = catId;
  document.getElementById("input-kpi-id").value = "";
  document.getElementById("input-kpi-code").value = `KPI-${Date.now().toString().slice(-2)}`;
  document.getElementById("input-kpi-title-text").value = "";
  document.getElementById("input-kpi-description").value = "";
  document.getElementById("input-kpi-measurement").value = "";
  document.getElementById("input-kpi-max-score").value = "3";
  document.getElementById("input-kpi-options-raw").value = "3 | 0 Breaches - Excellent (Score: 3)\n2 | 1 Breach - Minor (Score: 2)\n0 | 2+ Breaches - Failed (Score: 0)";
  document.getElementById("modal-edit-kpi").classList.remove("hidden");
}

function closeEditKpiModal() {
  document.getElementById("modal-edit-kpi").classList.add("hidden");
}

function saveKpiQuestionFromModal() {
  const siteId = document.getElementById("input-kpi-site-id").value;
  const catId = document.getElementById("input-kpi-section-id").value;
  const kpiId = document.getElementById("input-kpi-code").value.trim();
  const title = document.getElementById("input-kpi-title-text").value.trim();
  const desc = document.getElementById("input-kpi-description").value.trim();
  const measurement = document.getElementById("input-kpi-measurement").value.trim();
  const classification = document.getElementById("input-kpi-classification").value;
  const maxScore = Number(document.getElementById("input-kpi-max-score").value) || 3;
  const rawOptions = document.getElementById("input-kpi-options-raw").value.trim();

  if (!kpiId || !title) {
    alert("Please enter KPI Code and Title.");
    return;
  }

  const options = [];
  rawOptions.split("\n").forEach(line => {
    const parts = line.split("|");
    if (parts.length === 2) {
      options.push({ value: Number(parts[0].trim()), label: parts[1].trim() });
    }
  });

  const cat = app.siteTemplates[siteId].categories.find(c => c.id === catId);
  if (!cat) return;

  cat.kpis.push({
    id: kpiId,
    title,
    description: desc,
    classification,
    maxScore,
    measurement,
    options: options.length > 0 ? options : [
      { label: `Full marks (Score: ${maxScore})`, value: maxScore },
      { label: "Failed (Score: 0)", value: 0 }
    ]
  });

  saveToStorage();
  closeEditKpiModal();
  renderSitesView();
  showToast(`Question "${kpiId}" added to section!`, "success");
}

// -------------------------------------------------------------
// MODULE 5: USER MANAGEMENT (SUPER ADMIN & ACTIVE/INACTIVE)
// -------------------------------------------------------------
function renderUsersView() {
  const container = document.getElementById("users-main-container");
  if (!container) return;

  const current = getCurrentUser();
  const isSuper = current.role === USER_ROLES.SUPER_ADMIN;

  container.innerHTML = `
    <!-- Users Header -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-base font-bold text-slate-900 flex items-center">
          <i class="fa-solid fa-users mr-2 text-[#2E3092]"></i> User Accounts & RBAC Permissions
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Role-Based Access Control: Super Admin, Admin, Facility Engineer (Berkeley), and Client. Manage active status and site scopes.
        </p>
      </div>

      ${isSuper ? `
        <button onclick="openNewUserModal()" class="px-4 py-2 rounded-xl text-xs font-bold bg-[#2E3092] hover:bg-blue-900 text-white shadow-sm flex items-center transition-all">
          <i class="fa-solid fa-user-plus mr-1.5"></i> Create New User
        </button>
      ` : ''}
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
            <tr>
              <th class="py-3 px-4">User</th>
              <th class="py-3 px-4">Email</th>
              <th class="py-3 px-4">Role</th>
              <th class="py-3 px-4">Assigned Sites</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-semibold text-slate-700">
            ${app.users.map((u, idx) => {
              const roleColor = u.role === USER_ROLES.SUPER_ADMIN ? "bg-[#BE1E2D]" : 
                               (u.role === USER_ROLES.ADMIN ? "bg-[#2E3092]" : 
                               (u.role === USER_ROLES.FACILITY_ENGINEER ? "bg-[#006738]" : "bg-[#FBAF3F] text-slate-950"));
              const isActive = u.isActive !== false;

              return `
                <tr class="hover:bg-slate-50 transition-colors ${!isActive ? 'opacity-60 bg-slate-50/50' : ''}">
                  <td class="py-3 px-4">
                    <div class="flex items-center space-x-2.5">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 ${roleColor}">
                        ${u.avatar || u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div class="font-bold text-slate-900">${u.name}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-slate-600 font-mono text-[11px]">${u.email}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${roleColor} text-white">${u.role}</span>
                  </td>
                  <td class="py-3 px-4 text-[11px]">
                    ${Array.isArray(u.assignedSiteIds) && u.assignedSiteIds.includes("all") ? `
                      <span class="text-blue-700 font-bold"><i class="fa-solid fa-globe mr-1"></i> All Sites (Global)</span>
                    ` : (u.assignedSiteIds || []).map(sid => {
                      const s = app.siteTemplates[sid];
                      return `<span class="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] mr-1">${s ? s.siteName : sid}</span>`;
                    }).join("")}
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-[#006738]/15 text-[#006738]' : 'bg-slate-200 text-slate-500'}">
                      ${isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right space-x-2">
                    ${isSuper ? `
                      <button onclick="openEditUserModal('${u.id}')" class="text-blue-600 hover:text-blue-800 font-bold" title="Edit User">
                        <i class="fa-solid fa-user-pen"></i>
                      </button>
                      <button onclick="toggleUserStatus('${u.id}')" class="text-amber-600 hover:text-amber-800 font-bold" title="${isActive ? 'Deactivate' : 'Activate'}">
                        <i class="fa-solid ${isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
                      </button>
                      ${u.role !== USER_ROLES.SUPER_ADMIN ? `
                        <button onclick="deleteUser('${u.id}')" class="text-red-500 hover:text-red-700 font-bold" title="Delete">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      ` : ''}
                    ` : `
                      <span class="text-slate-400 text-[10px]">Read-only</span>
                    `}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openNewUserModal() {
  document.getElementById("modal-user-form-title").innerHTML = `<i class="fa-solid fa-user-plus mr-2 text-[#FBAF3F]"></i> Create New User`;
  document.getElementById("input-edit-user-id").value = "";
  document.getElementById("input-edit-user-name").value = "";
  document.getElementById("input-edit-user-email").value = "";
  document.getElementById("input-edit-user-role").value = "Client";
  document.getElementById("input-edit-user-status").checked = true;

  renderUserSiteCheckboxes([]);
  document.getElementById("modal-edit-user").classList.remove("hidden");
}

function openEditUserModal(userId) {
  const user = app.users.find(u => u.id === userId);
  if (!user) return;

  document.getElementById("modal-user-form-title").innerHTML = `<i class="fa-solid fa-user-gear mr-2 text-[#FBAF3F]"></i> Edit User & Permissions`;
  document.getElementById("input-edit-user-id").value = user.id;
  document.getElementById("input-edit-user-name").value = user.name;
  document.getElementById("input-edit-user-email").value = user.email;
  document.getElementById("input-edit-user-role").value = user.role;
  document.getElementById("input-edit-user-status").checked = user.isActive !== false;

  renderUserSiteCheckboxes(user.assignedSiteIds || []);
  document.getElementById("modal-edit-user").classList.remove("hidden");
}

function closeEditUserModal() {
  document.getElementById("modal-edit-user").classList.add("hidden");
}

function renderUserSiteCheckboxes(assigned) {
  const container = document.getElementById("modal-edit-user-sites-checkboxes");
  if (!container) return;

  const sites = Object.values(app.siteTemplates || {});
  container.innerHTML = sites.map(s => {
    const isChecked = assigned.includes("all") || assigned.includes(s.siteId);
    return `
      <label class="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
        <input type="checkbox" value="${s.siteId}" ${isChecked ? 'checked' : ''} class="rounded border-slate-300 text-[#2E3092] focus:ring-[#2E3092]">
        <span>${s.siteName} (${s.clientName})</span>
      </label>
    `;
  }).join("");
}

function saveUserFromModal() {
  const editId = document.getElementById("input-edit-user-id").value;
  const name = document.getElementById("input-edit-user-name").value.trim();
  const email = document.getElementById("input-edit-user-email").value.trim();
  const role = document.getElementById("input-edit-user-role").value;
  const isActive = document.getElementById("input-edit-user-status").checked;

  const checkedSites = [];
  document.querySelectorAll("#modal-edit-user-sites-checkboxes input:checked").forEach(cb => {
    checkedSites.push(cb.value);
  });

  if (!name || !email) {
    alert("Please enter Name and Email.");
    return;
  }

  const assignedSiteIds = (role === USER_ROLES.SUPER_ADMIN || role === USER_ROLES.ADMIN) ? ["all"] : (checkedSites.length > 0 ? checkedSites : [app.activeSiteId]);

  if (editId) {
    const u = app.users.find(user => user.id === editId);
    if (u) {
      u.name = name;
      u.email = email;
      u.role = role;
      u.isActive = isActive;
      u.assignedSiteIds = assignedSiteIds;
      showToast(`User "${name}" updated!`, "success");
    }
  } else {
    app.users.push({
      id: `usr-${Date.now().toString().slice(-4)}`,
      name,
      email,
      role,
      organization: role === USER_ROLES.CLIENT ? "Client Organization" : "Berkeley Services UAE",
      assignedSiteIds,
      isActive,
      avatar: name.slice(0, 2).toUpperCase()
    });
    showToast(`User "${name}" created!`, "success");
  }

  saveToStorage();
  closeEditUserModal();
  renderHeaderControls();
  renderUsersView();
}

function toggleUserStatus(userId) {
  const u = app.users.find(user => user.id === userId);
  if (!u) return;
  if (u.role === USER_ROLES.SUPER_ADMIN && u.id === app.currentUserId) {
    showToast("Cannot deactivate currently active Super Admin account.", "error");
    return;
  }
  u.isActive = !u.isActive;
  saveToStorage();
  renderHeaderControls();
  renderUsersView();
  showToast(`User "${u.name}" status: ${u.isActive ? 'ACTIVE' : 'INACTIVE'}`, "info");
}

function deleteUser(userId) {
  const u = app.users.find(user => user.id === userId);
  if (!u) return;
  if (u.role === USER_ROLES.SUPER_ADMIN) {
    showToast("Super Admin accounts cannot be deleted.", "error");
    return;
  }
  if (confirm(`Delete user "${u.name}"?`)) {
    app.users = app.users.filter(user => user.id !== userId);
    saveToStorage();
    renderHeaderControls();
    renderUsersView();
    showToast(`User deleted.`, "info");
  }
}

// -------------------------------------------------------------
// MODULE 6: AUDIT LOG TIMELINE MODAL
// -------------------------------------------------------------
function openAuditLogModal(siteId, month) {
  const rec = app.monthlyRecords[getRecordKey(siteId, month)];
  const tmpl = app.siteTemplates[siteId] || getCurrentTemplate();
  if (!rec) {
    showToast("No record found to display audit log.", "error");
    return;
  }

  const normSt = normalizeStatus(rec.status);
  const finTotal = calculateScoreTotal(rec, "final");
  const maxScore = tmpl.maxTotalScore || 100;

  // Header meta
  const metaHeader = document.getElementById("audit-log-meta-header");
  metaHeader.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <div class="font-bold text-slate-900 text-sm">${rec.siteName} &bull; ${rec.month}</div>
        <div class="text-[11px] text-slate-500 font-mono">Reference: ${rec.recordId} &bull; Version: ${rec.currentVersion}</div>
      </div>
      <div class="text-right">
        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#006738]/15 text-[#006738] border border-[#006738]/30 inline-block">${normSt}</span>
        <div class="text-[11px] font-bold text-slate-700 mt-1">Final Score: <b class="text-[#2E3092]">${finTotal} / ${maxScore}</b></div>
      </div>
    </div>
  `;

  // Timeline nodes
  const timelineContainer = document.getElementById("audit-log-timeline-container");
  const logs = rec.auditLog && rec.auditLog.length > 0 ? rec.auditLog : [
    {
      version: rec.currentVersion,
      author: rec.clientName,
      role: "Client",
      action: "Monthly Evaluation Initialized",
      timestamp: rec.createdAt || new Date().toLocaleString(),
      note: "Record created and saved.",
      diffs: []
    }
  ];

  timelineContainer.innerHTML = logs.map((log, idx) => {
    return `
      <div class="relative pl-6 space-y-1">
        <!-- Node Dot -->
        <span class="absolute left-[-17px] top-1 w-4 h-4 rounded-full border-2 border-white bg-[#2E3092] shadow"></span>

        <div class="flex flex-wrap items-center justify-between text-xs">
          <div class="font-bold text-slate-900">${log.action}</div>
          <span class="text-[10px] text-slate-400 font-mono">${log.timestamp}</span>
        </div>

        <div class="text-[11px] text-slate-600">
          By: <b class="text-slate-800">${log.author}</b> (<span class="font-bold text-[#006738]">${log.role}</span>) &bull; <span class="font-mono text-slate-500">${log.version}</span>
        </div>

        <p class="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">${log.note}</p>

        ${log.diffs && log.diffs.length > 0 ? `
          <div class="bg-blue-50/50 p-2 rounded-lg border border-blue-100 text-[11px] space-y-0.5 text-slate-700">
            <span class="font-bold text-[#2E3092] block text-[10px] uppercase">Recorded Audit Diffs:</span>
            ${log.diffs.map(d => `<div>&bull; ${d}</div>`).join("")}
          </div>
        ` : ''}
      </div>
    `;
  }).join("");

  document.getElementById("modal-audit-log").classList.remove("hidden");
}

function closeAuditLogModal() {
  document.getElementById("modal-audit-log").classList.add("hidden");
}

// -------------------------------------------------------------
// MODULE 7: NOTIFICATION ENGINE & EMAIL/MEMO TEMPLATES
// -------------------------------------------------------------
function addNotification(data) {
  const notif = {
    id: `notif-${Date.now()}`,
    type: data.type,
    title: data.title,
    message: data.message,
    siteId: data.siteId,
    siteName: data.siteName,
    month: data.month,
    recordId: data.recordId,
    actorName: data.actorName,
    actorRole: data.actorRole,
    scores: data.scores || {},
    timestamp: new Date().toLocaleString(),
    isRead: false
  };

  app.notifications.unshift(notif);
  if (app.notifications.length > 50) app.notifications.pop(); // Keep last 50
  saveToStorage();
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const badge = document.getElementById("notif-badge");
  if (!badge) return;
  const unreadCount = app.notifications.filter(n => !n.isRead).length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function openNotificationsModal() {
  const container = document.getElementById("notifications-list-container");
  if (!container) return;

  if (app.notifications.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-400">
        <i class="fa-solid fa-bell-slash text-2xl mb-2 block"></i>
        No system notifications yet.
      </div>
    `;
  } else {
    container.innerHTML = app.notifications.map(n => {
      return `
        <div 
          onclick="openNotificationPreview('${n.id}')"
          class="p-3.5 rounded-xl border ${n.isRead ? 'border-slate-200 bg-white' : 'border-blue-300 bg-blue-50/60 ring-1 ring-blue-100'} cursor-pointer hover:shadow-sm transition-all space-y-1"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-900 flex items-center">
              ${!n.isRead ? '<span class="w-2 h-2 rounded-full bg-[#2E3092] mr-1.5 shrink-0"></span>' : ''}
              ${n.title}
            </span>
            <span class="text-[10px] text-slate-400 font-mono">${n.timestamp}</span>
          </div>
          <p class="text-[11px] text-slate-600 line-clamp-2">${n.message}</p>
          <div class="text-[10px] text-[#2E3092] font-bold pt-1 flex items-center justify-between">
            <span>Click to preview corporate memo &bull; ${n.siteName} (${n.month})</span>
            <i class="fa-solid fa-chevron-right text-[9px]"></i>
          </div>
        </div>
      `;
    }).join("");
  }

  document.getElementById("modal-notifications").classList.remove("hidden");
}

function closeNotificationsModal() {
  document.getElementById("modal-notifications").classList.add("hidden");
}

function markAllNotificationsRead() {
  app.notifications.forEach(n => n.isRead = true);
  saveToStorage();
  updateNotificationBadge();
  openNotificationsModal();
  showToast("All notifications marked as read.", "info");
}

function openNotificationPreview(notifId) {
  const notif = app.notifications.find(n => n.id === notifId);
  if (!notif) return;
  notif.isRead = true;
  saveToStorage();
  updateNotificationBadge();

  const previewBox = document.getElementById("notification-memo-preview-box");
  const template = app.siteTemplates[notif.siteId] || getCurrentTemplate();

  previewBox.innerHTML = `
    <!-- Memo Header Banner -->
    <div class="border-b-2 border-[#2E3092] pb-4 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <img src="${app.branding.berkleyLogo || 'assets/berkeley-logo.png'}" alt="Berkeley Services" class="h-8 object-contain">
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-900 tracking-tight">BERKELEY SERVICES UAE</h2>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FACILITIES MANAGEMENT &bull; CLIENT KPI AGENT</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-[10px] font-bold text-[#2E3092] uppercase">OFFICIAL KPI MEMORANDUM</div>
        <div class="text-[10px] text-slate-400 font-mono">REF: ${notif.recordId || 'N/A'}</div>
      </div>
    </div>

    <!-- Memo Routing Details -->
    <div class="grid grid-cols-2 gap-4 text-xs py-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
      <div><span class="font-bold text-slate-500 uppercase text-[10px]">DATE:</span> <span class="text-slate-800">${notif.timestamp}</span></div>
      <div><span class="font-bold text-slate-500 uppercase text-[10px]">PERIOD:</span> <span class="font-bold text-slate-900">${notif.month}</span></div>
      <div><span class="font-bold text-slate-500 uppercase text-[10px]">CONTRACT / SITE:</span> <span class="font-bold text-[#2E3092]">${notif.siteName}</span></div>
      <div><span class="font-bold text-slate-500 uppercase text-[10px]">CLIENT ORG:</span> <span class="text-slate-800">${template.clientName}</span></div>
      <div><span class="font-bold text-slate-500 uppercase text-[10px]">INITIATED BY:</span> <span class="font-bold text-slate-900">${notif.actorName} (${notif.actorRole})</span></div>
      <div><span class="font-bold text-slate-500 uppercase text-[10px]">EVENT TYPE:</span> <span class="font-mono text-emerald-800 font-bold">${notif.type}</span></div>
    </div>

    <!-- Memo Subject & Message -->
    <div class="space-y-2 pt-2">
      <div class="text-xs font-bold text-slate-900 uppercase">SUBJECT: <span class="text-[#2E3092]">${notif.title}</span></div>
      <p class="text-xs text-slate-700 leading-relaxed">${notif.message}</p>
    </div>

    <!-- Score Summary Table -->
    ${notif.scores && notif.scores.final !== undefined ? `
      <div class="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
        <div class="text-[11px] font-bold text-[#2E3092] uppercase">Performance Metrics Summary</div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-white p-2 rounded-lg border border-blue-100">
            <div class="text-[10px] text-slate-400 font-bold">CLIENT SCORE</div>
            <div class="text-sm font-black text-[#2E3092]">${notif.scores.client || '--'} / 100</div>
          </div>
          <div class="bg-white p-2 rounded-lg border border-blue-100">
            <div class="text-[10px] text-slate-400 font-bold">BERKELEY SCORE</div>
            <div class="text-sm font-black text-amber-900">${notif.scores.berkeley || '--'} / 100</div>
          </div>
          <div class="bg-white p-2 rounded-lg border border-blue-100">
            <div class="text-[10px] text-slate-400 font-bold">AGREED FINAL SCORE</div>
            <div class="text-sm font-black text-[#006738]">${notif.scores.final || '--'} / 100</div>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Call to Action -->
    <div class="pt-4 border-t border-slate-200 flex items-center justify-between">
      <span class="text-[10px] text-slate-400 italic">This communication was generated automatically by the Berkeley KPI Agent.</span>
      <button onclick="jumpToEvaluation('${notif.siteId}', '${notif.month}'); closeNotificationPreviewModal();" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#2E3092] text-white hover:bg-blue-900 shadow-sm">
        Open KPI in Portal &rarr;
      </button>
    </div>
  `;

  document.getElementById("modal-notification-preview").classList.remove("hidden");
}

function closeNotificationPreviewModal() {
  document.getElementById("modal-notification-preview").classList.add("hidden");
}

function copyNotificationHtml() {
  const box = document.getElementById("notification-memo-preview-box");
  if (!box) return;
  navigator.clipboard.writeText(box.innerHTML).then(() => {
    showToast("Copied formatted memo HTML to clipboard!", "success");
  }).catch(() => {
    showToast("HTML copied to clipboard.", "info");
  });
}

function copyNotificationText() {
  const box = document.getElementById("notification-memo-preview-box");
  if (!box) return;
  navigator.clipboard.writeText(box.innerText).then(() => {
    showToast("Copied plain text memo to clipboard!", "success");
  }).catch(() => {
    showToast("Memo text copied.", "info");
  });
}

// -------------------------------------------------------------
// MODULE 8: BERKELEY BRAND LOGO MANAGEMENT
// -------------------------------------------------------------
function openBerkeleyLogoModal() {
  const preview = document.getElementById("modal-berkeley-logo-preview");
  if (preview) preview.src = app.branding.berkleyLogo || "assets/berkeley-logo.png";
  document.getElementById("input-berkeley-logo-url").value = "";
  document.getElementById("modal-berkeley-logo").classList.remove("hidden");
}

function closeBerkeleyLogoModal() {
  document.getElementById("modal-berkeley-logo").classList.add("hidden");
}

function saveBerkeleyLogo() {
  const url = document.getElementById("input-berkeley-logo-url").value.trim();
  const temp = app.branding.tempLogo;
  if (url) {
    app.branding.berkleyLogo = url;
  } else if (temp) {
    app.branding.berkleyLogo = temp;
  }
  delete app.branding.tempLogo;
  saveToStorage();
  closeBerkeleyLogoModal();
  renderSidebar();
  renderActiveView();
  showToast("Berkeley brand logo updated!", "success");
}

function resetBerkeleyLogoDefault() {
  app.branding.berkleyLogo = "assets/berkeley-logo.png";
  saveToStorage();
  closeBerkeleyLogoModal();
  renderSidebar();
  renderActiveView();
  showToast("Reset to default Berkeley logo.", "info");
}

// -------------------------------------------------------------
// FACTORY RESET & TOAST ALERTS
// -------------------------------------------------------------
function resetAllDataToDefaults() {
  if (confirm("Reset all portal data to fresh factory state?")) {
    try { localStorage.clear(); } catch(e) {}
    app.monthlyRecords = {};
    app.siteTemplates = JSON.parse(JSON.stringify(INITIAL_SITES));
    app.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    app.activeSiteId = "site-yam";
    app.activeMonth = "2026-09";
    app.activeYear = "2026";
    app.currentUserId = "usr-superadmin";
    app.activeNav = "dashboard";
    app.notifications = [];
    app.branding = { berkleyLogo: "assets/berkeley-logo.png" };
    saveToStorage();
    renderSidebar();
    renderHeaderControls();
    renderActiveView();
    updateNotificationBadge();
    showToast("Portal reset to clean factory state!", "success");
  }
}

function showToast(msg, type = "info") {
  const t = document.createElement("div");
  const bg = type === "success" ? "bg-[#006738]" : (type === "error" ? "bg-[#BE1E2D]" : "bg-[#2E3092]");
  t.className = `fixed bottom-6 right-6 z-50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold transition-all ${bg}`;
  t.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} text-base"></i><span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => {
    try { t.remove(); } catch(e) {}
  }, 4000);
}

// Explicit Window Bindings for HTML inline event handlers
window.createNewMonthlyRecord = createNewMonthlyRecord;
window.handleClientSubmitForReview = handleClientSubmitForReview;
window.handleClientApproveAndFreeze = handleClientApproveAndFreeze;
window.handleBerkeleySubmitBackToClient = handleBerkeleySubmitBackToClient;
window.handleBerkeleyFinalize = handleBerkeleyFinalize;
window.unfreezeCurrentRecord = unfreezeCurrentRecord;
window.promptProofAttachment = promptProofAttachment;
window.openRecordInEvaluation = openRecordInEvaluation;
window.exportSingleRecordExcel = exportSingleRecordExcel;
window.selectDashboardMonth = selectDashboardMonth;
window.jumpToEvaluation = jumpToEvaluation;
window.openNewSiteModal = openNewSiteModal;
window.openEditSiteModal = openEditSiteModal;
window.closeNewSiteModal = closeNewSiteModal;
window.saveNewSiteFromModal = saveNewSiteFromModal;
window.openCloneSiteModal = openCloneSiteModal;
window.closeCloneSiteModal = closeCloneSiteModal;
window.executeCloneQuestionnaire = executeCloneQuestionnaire;
window.openAddSectionModal = openAddSectionModal;
window.openEditSectionModal = openEditSectionModal;
window.closeEditSectionModal = closeEditSectionModal;
window.saveSectionFromModal = saveSectionFromModal;
window.deleteSection = deleteSection;
window.openAddKpiModal = openAddKpiModal;
window.closeEditKpiModal = closeEditKpiModal;
window.saveKpiQuestionFromModal = saveKpiQuestionFromModal;
window.openNewUserModal = openNewUserModal;
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.saveUserFromModal = saveUserFromModal;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.setSiteAndOpen = setSiteAndOpen;
window.openAuditLogModal = openAuditLogModal;
window.closeAuditLogModal = closeAuditLogModal;
window.openNotificationsModal = openNotificationsModal;
window.closeNotificationsModal = closeNotificationsModal;
window.markAllNotificationsRead = markAllNotificationsRead;
window.openNotificationPreview = openNotificationPreview;
window.closeNotificationPreviewModal = closeNotificationPreviewModal;
window.copyNotificationHtml = copyNotificationHtml;
window.copyNotificationText = copyNotificationText;
window.openBerkeleyLogoModal = openBerkeleyLogoModal;
window.closeBerkeleyLogoModal = closeBerkeleyLogoModal;
window.saveBerkeleyLogo = saveBerkeleyLogo;
window.resetBerkeleyLogoDefault = resetBerkeleyLogoDefault;
window.resetAllDataToDefaults = resetAllDataToDefaults;
