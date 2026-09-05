"use strict";

const STORAGE_KEY = "dashboard-pelatihan-neon-v1";
const ADMIN_KEY_SESSION = "dashboard-pelatihan-admin-key";
const LOCATION_COLORS = ["#0b2f6b", "#1f63b5", "#d71920", "#ec5b62", "#6689ca", "#9fb4dc"];
const STATUS_SORT_ORDER = Object.freeze({
  "Akan Dilaksanakan": 0,
  "Dalam Konfirmasi": 1,
  "Dibatalkan": 2
});

const state = {
  rows: [],
  weeks: [],
  meta: {
    fileName: "",
    sheetName: "",
    uploadedAt: ""
  },
  periodPreset: "",
  statusFilter: "all",
  locationFilter: "all",
  search: "",
  highlightNote: "",
  databaseConnected: false,
  uploadProtected: false,
  loading: false
};

const elements = {};
let toastTimer = null;

function cacheElements() {
  const ids = [
    "sidebar", "mobileBackdrop", "menuButton", "periodPreset", "periodLabel",
    "lastUpdated", "exportPngButton", "changeDataButton", "kpiTotal", "kpiTotalTrainingCount", "kpiScheduled",
    "kpiScheduledTrainingCount", "kpiConfirmation", "kpiCancelled",
    "confirmationProgress", "cancelledProgress", "confirmationPercent", "cancelledPercent",
    "donutSegments", "donutTotal", "locationLegend", "typeBars", "highlightType",
    "highlightLocation", "highlightEditButton", "highlightCustomText", "customHighlightItem",
    "customHighlightDivider", "datasetLabel", "statusFilter", "locationFilter", "searchInput",
    "trainingTableBody", "emptyTable", "paginationInfo", "uploadModal", "uploadCloseButton",
    "dropzone", "fileInput", "selectedFileName", "uploadProgress", "uploadMessage",
    "clearDataButton", "chooseFileButton", "adminKeyGroup", "adminKeyInput", "highlightModal",
    "highlightCloseButton", "highlightTextInput", "highlightCharacterCount",
    "clearHighlightButton", "cancelHighlightButton", "saveHighlightButton", "detailModal",
    "detailCloseButton", "detailStatus", "detailTitle", "detailSubtitle", "detailGrid", "toast"
  ];

  ids.forEach((id) => {
    elements[id] = document.getElementById(id);
  });
  elements.table = elements.trainingTableBody.closest("table");
}

function parseDateOnly(value) {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(source, days) {
  const date = new Date(source.getFullYear(), source.getMonth(), source.getDate());
  date.setDate(date.getDate() + days);
  return date;
}

function formatDate(value) {
  const date = parseDateOnly(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date).replaceAll(".", "");
}

function formatDateLong(value) {
  if (!value) return "Belum ada data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum ada data";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(date);
  return formatted
    .replace(/([A-Za-z]{3})\./g, "$1")
    .replace(/(\d{2})\.(\d{2})$/, "$1:$2") + " WIB";
}

function startOfWeek(sourceDate, offsetWeeks = 0) {
  const date = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate());
  const day = date.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + distanceToMonday + (offsetWeeks * 7));
  return date;
}

function getDataRange() {
  const dates = state.rows
    .map((row) => parseDateOnly(row.tanggal_mulai))
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (!dates.length) return { start: null, end: null };
  return { start: dates[0], end: dates[dates.length - 1] };
}

function getPeriodBounds() {
  if (state.periodPreset === "all") {
    return { start: null, end: null };
  }
  const start = parseDateOnly(state.periodPreset);
  return start ? { start, end: addDays(start, 6) } : getDataRange();
}

function getPeriodRows() {
  return [...state.rows];
}

function getClassCount(row) {
  const classCount = Number(row?.jumlah_kelas);
  return Number.isFinite(classCount) && classCount > 0 ? classCount : 1;
}

function sumClasses(rows) {
  return rows.reduce((sum, row) => sum + getClassCount(row), 0);
}

function compareTrainingRows(a, b) {
  const statusA = STATUS_SORT_ORDER[a.status_kategori] ?? Number.MAX_SAFE_INTEGER;
  const statusB = STATUS_SORT_ORDER[b.status_kategori] ?? Number.MAX_SAFE_INTEGER;
  if (statusA !== statusB) return statusA - statusB;

  const dateA = parseDateOnly(a.tanggal_mulai);
  const dateB = parseDateOnly(b.tanggal_mulai);
  if (dateA && dateB) {
    const dateDifference = dateA.getTime() - dateB.getTime();
    if (dateDifference !== 0) return dateDifference;
  } else if (dateA) {
    return -1;
  } else if (dateB) {
    return 1;
  }

  const codeDifference = String(a.kode ?? "").localeCompare(
    String(b.kode ?? ""),
    "id-ID",
    { numeric: true, sensitivity: "base" }
  );
  if (codeDifference !== 0) return codeDifference;

  return String(a.judul_pelatihan ?? "").localeCompare(
    String(b.judul_pelatihan ?? ""),
    "id-ID",
    { sensitivity: "base" }
  );
}

function getFilteredRows() {
  const query = state.search.trim().toLocaleLowerCase("id-ID");
  return getPeriodRows()
    .filter((row) => {
      const statusMatch = state.statusFilter === "all" || row.status_kategori === state.statusFilter;
      const locationMatch = state.locationFilter === "all" || row.lokasi === state.locationFilter;
      const searchText = [
        row.kode,
        row.status_kategori,
        row.status_asli,
        row.jenis_pelatihan,
        row.pembiayaan,
        row.lokasi,
        row.judul_pelatihan
      ].join(" ").toLocaleLowerCase("id-ID");
      return statusMatch && locationMatch && (!query || searchText.includes(query));
    })
    .sort(compareTrainingRows);
}

function percentage(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function countBy(rows, property) {
  const counts = new Map();
  rows.forEach((row) => {
    const key = String(row[property] || "Lainnya").trim() || "Lainnya";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "id"));
}

function countClassesBy(rows, property) {
  const counts = new Map();
  rows.forEach((row) => {
    const key = String(row[property] || "Lainnya").trim() || "Lainnya";
    counts.set(key, (counts.get(key) || 0) + getClassCount(row));
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "id"));
}

function compactGroups(groups, limit) {
  if (groups.length <= limit) return groups;
  const visible = groups.slice(0, limit - 1);
  const others = groups.slice(limit - 1).reduce((sum, item) => sum + item.value, 0);
  return [...visible, { label: "Lainnya", value: others }];
}

function formatWeekRange(weekStart) {
  const start = parseDateOnly(weekStart);
  if (!start) return "Periode tidak valid";
  return `${formatDate(toIsoDate(start))} – ${formatDate(toIsoDate(addDays(start, 6)))}`;
}

function relativeWeekName(weekStart) {
  const current = toIsoDate(startOfWeek(new Date()));
  const next = toIsoDate(startOfWeek(new Date(), 1));
  if (weekStart === current) return "Minggu ini";
  if (weekStart === next) return "Minggu depan";
  return "Minggu data";
}

function formatPeriodLabel() {
  if (state.loading) return "Memuat data...";
  if (!state.databaseConnected) return "Database belum terhubung";
  if (!state.periodPreset) return "Belum ada periode";
  if (state.periodPreset === "all") return "Semua data di database";
  return formatWeekRange(state.periodPreset);
}

function formatWeekOption(week) {
  const start = String(week.week_start || "");
  const trainingCount = Number(week.training_count || 0);
  const classCount = Number(week.class_count || 0);
  return `${relativeWeekName(start)} • ${formatWeekRange(start)} • ${trainingCount} judul / ${classCount} kelas`;
}

function chooseDefaultPeriod(weeks, preferred = "") {
  const available = new Set(weeks.map((week) => String(week.week_start)));
  if (preferred === "all" || available.has(preferred)) return preferred;

  const saved = loadPreference();
  if (saved === "all" || available.has(saved)) return saved;

  const next = toIsoDate(startOfWeek(new Date(), 1));
  if (available.has(next)) return next;

  const current = toIsoDate(startOfWeek(new Date()));
  if (available.has(current)) return current;

  const future = weeks
    .map((week) => String(week.week_start))
    .filter((value) => value > current)
    .sort();
  if (future.length) return future[0];

  return weeks.length ? String(weeks[0].week_start) : "";
}

function renderPeriod() {
  const options = [];
  if (state.weeks.length) {
    options.push('<option value="all">Semua data</option>');
    state.weeks.forEach((week) => {
      const value = String(week.week_start || "");
      options.push(`<option value="${escapeAttribute(value)}">${escapeHtml(formatWeekOption(week))}</option>`);
    });
  } else {
    options.push('<option value="">Belum ada minggu di database</option>');
  }

  elements.periodPreset.innerHTML = options.join("");
  elements.periodPreset.value = state.periodPreset;
  elements.periodPreset.disabled = state.loading || !state.databaseConnected || !state.weeks.length;
  elements.periodLabel.textContent = formatPeriodLabel();
}

function renderHeader() {
  elements.lastUpdated.textContent = formatDateLong(state.meta.uploadedAt);
  if (!state.databaseConnected) {
    elements.datasetLabel.textContent = "NeonDB belum terhubung atau belum dapat diakses.";
    return;
  }

  if (!state.weeks.length) {
    elements.datasetLabel.textContent = "Database sudah terhubung, tetapi belum memiliki data pelatihan.";
    return;
  }

  const parts = [state.meta.fileName || "Data pelatihan NeonDB"];
  if (state.meta.sheetName) parts.push(`Sheet: ${state.meta.sheetName}`);
  parts.push(`${state.rows.length} baris pada periode ini`);
  elements.datasetLabel.textContent = parts.join(" • ");
}

function renderKpis() {
  const rows = getPeriodRows();
  const totalTrainingCount = rows.length;
  const totalClasses = sumClasses(rows);
  const scheduledRows = rows.filter((row) => row.status_kategori === "Akan Dilaksanakan");
  const confirmationRows = rows.filter((row) => row.status_kategori === "Dalam Konfirmasi");
  const cancelledRows = rows.filter((row) => row.status_kategori === "Dibatalkan");

  const scheduledTrainingCount = scheduledRows.length;
  const scheduledClasses = sumClasses(scheduledRows);
  const confirmationClasses = sumClasses(confirmationRows);
  const cancelledClasses = sumClasses(cancelledRows);

  const confirmationPct = percentage(confirmationClasses, totalClasses);
  const cancelledPct = percentage(cancelledClasses, totalClasses);

  elements.kpiTotal.textContent = String(totalClasses);
  elements.kpiTotalTrainingCount.textContent = String(totalTrainingCount);
  elements.kpiScheduled.textContent = String(scheduledClasses);
  elements.kpiScheduledTrainingCount.textContent = String(scheduledTrainingCount);
  elements.kpiConfirmation.textContent = String(confirmationClasses);
  elements.kpiCancelled.textContent = String(cancelledClasses);

  elements.confirmationPercent.textContent = `${confirmationPct}%`;
  elements.cancelledPercent.textContent = `${cancelledPct}%`;
  elements.confirmationProgress.style.width = `${confirmationPct}%`;
  elements.cancelledProgress.style.width = `${cancelledPct}%`;
}

function renderLocationChart() {
  const rows = getPeriodRows();
  const total = sumClasses(rows);
  const groups = compactGroups(countClassesBy(rows, "lokasi"), 5);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  elements.donutTotal.textContent = String(total);
  elements.donutSegments.replaceChildren();

  if (!total) {
    elements.locationLegend.innerHTML = '<div class="empty-chart">Belum ada data lokasi pada periode ini.</div>';
    return;
  }

  groups.forEach((item, index) => {
    const rawLength = (item.value / total) * circumference;
    const segmentLength = Math.max(rawLength - 1.8, 0.5);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "donut-segment");
    circle.setAttribute("cx", "80");
    circle.setAttribute("cy", "80");
    circle.setAttribute("r", String(radius));
    circle.setAttribute("stroke", LOCATION_COLORS[index % LOCATION_COLORS.length]);
    circle.setAttribute("stroke-dasharray", `${segmentLength} ${circumference - segmentLength}`);
    circle.setAttribute("stroke-dashoffset", String(-offset));
    elements.donutSegments.appendChild(circle);
    offset += rawLength;
  });

  elements.locationLegend.innerHTML = groups.map((item, index) => `
    <div class="legend-item" title="${escapeAttribute(item.label)}">
      <span class="legend-dot" style="background:${LOCATION_COLORS[index % LOCATION_COLORS.length]}"></span>
      <span class="legend-label">${escapeHtml(item.label)}</span>
      <span class="legend-value">(${item.value})</span>
    </div>
  `).join("");
}

function renderTypeChart() {
  const rows = getPeriodRows();
  const groups = compactGroups(countClassesBy(rows, "jenis_pelatihan"), 5);

  if (!groups.length) {
    elements.typeBars.innerHTML = '<div class="empty-chart">Belum ada data jenis pelatihan pada periode ini.</div>';
    return;
  }

  const maximum = Math.max(...groups.map((item) => item.value), 1);
  elements.typeBars.innerHTML = groups.map((item) => {
    const width = Math.max((item.value / maximum) * 100, 2);
    return `
      <div class="bar-row" title="${escapeAttribute(item.label)}: ${item.value}">
        <span class="bar-label">${escapeHtml(item.label)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${width}%"></span></span>
        <span class="bar-value">${item.value}</span>
      </div>
    `;
  }).join("");
}

function renderHighlights() {
  const rows = getPeriodRows();
  const types = countClassesBy(rows, "jenis_pelatihan");
  const locations = countClassesBy(rows, "lokasi");

  if (!rows.length) {
    elements.highlightType.textContent = "Belum ada data pada periode yang dipilih.";
    elements.highlightLocation.textContent = "Belum ada data pada periode yang dipilih.";
  } else {
    const topType = types[0];
    const topLocation = locations[0];
    elements.highlightType.textContent = `Pelatihan ${topType.label} mendominasi dengan ${topType.value} kelas.`;
    elements.highlightLocation.textContent = `${topLocation.label} menjadi lokasi terbanyak dengan ${topLocation.value} kelas.`;
  }

  const hasCustomNote = Boolean(state.highlightNote.trim());
  elements.customHighlightItem.hidden = !hasCustomNote;
  elements.customHighlightDivider.hidden = !hasCustomNote;
  elements.highlightCustomText.textContent = hasCustomNote ? state.highlightNote : "";
  const buttonLabel = elements.highlightEditButton.querySelector("span");
  if (buttonLabel) {
    buttonLabel.textContent = state.periodPreset === "all"
      ? "Pilih Minggu"
      : (hasCustomNote ? "Edit Catatan" : "Tambah Catatan");
  }
  elements.highlightEditButton.disabled = !state.databaseConnected || !state.periodPreset || state.periodPreset === "all";
  elements.highlightEditButton.setAttribute(
    "aria-label",
    state.periodPreset === "all"
      ? "Pilih satu minggu untuk mengelola catatan"
      : (hasCustomNote ? "Edit catatan tambahan highlight" : "Tambah catatan highlight")
  );
}

function statusClass(status) {
  if (status === "Dibatalkan") return "status-cancelled";
  if (status === "Dalam Konfirmasi") return "status-confirmation";
  return "status-scheduled";
}

function rowClass(status) {
  if (status === "Dibatalkan") return "cancelled-row";
  if (status === "Dalam Konfirmasi") return "confirmation-row";
  return "";
}

function renderLocationFilterOptions() {
  const locations = [...new Set(getPeriodRows().map((row) => row.lokasi).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "id"));

  if (state.locationFilter !== "all" && !locations.includes(state.locationFilter)) {
    state.locationFilter = "all";
  }

  elements.locationFilter.innerHTML = [
    '<option value="all">Semua Lokasi</option>',
    ...locations.map((location) => `<option value="${escapeAttribute(location)}">${escapeHtml(location)}</option>`)
  ].join("");
  elements.locationFilter.value = state.locationFilter;
}

function renderTable() {
  const rows = getFilteredRows();

  elements.table.hidden = rows.length === 0;
  elements.emptyTable.hidden = rows.length !== 0;

  elements.trainingTableBody.innerHTML = rows.map((row) => `
    <tr class="${rowClass(row.status_kategori)}">
      <td>${escapeHtml(row.kode)}</td>
      <td><span class="status-badge ${statusClass(row.status_kategori)}">${escapeHtml(row.status_kategori)}</span></td>
      <td>${escapeHtml(row.jenis_pelatihan)}</td>
      <td>${escapeHtml(row.pembiayaan)}</td>
      <td>${escapeHtml(row.lokasi)}</td>
      <td class="center-cell">${escapeHtml(String(row.jumlah_kelas || 1))}</td>
      <td class="title-cell">${escapeHtml(row.judul_pelatihan)}</td>
      <td>${escapeHtml(formatDate(row.tanggal_mulai))}</td>
      <td>${escapeHtml(formatDate(row.akhir_tm))}</td>
      <td>
        <button class="detail-button" type="button" data-detail-id="${escapeAttribute(row.id)}" aria-label="Lihat detail ${escapeAttribute(row.judul_pelatihan)}">
          <svg class="icon"><use href="#icon-chevron"></use></svg>
        </button>
      </td>
    </tr>
  `).join("");

  const visibleClasses = sumClasses(rows);
  elements.paginationInfo.textContent = rows.length
    ? `Menampilkan seluruh ${rows.length} judul pelatihan • ${visibleClasses} kelas`
    : "Menampilkan 0 data";
}

function renderAll() {
  renderPeriod();
  renderHeader();
  renderKpis();
  renderLocationChart();
  renderTypeChart();
  renderHighlights();
  renderLocationFilterOptions();
  elements.statusFilter.value = state.statusFilter;
  elements.searchInput.value = state.search;
  renderTable();
  elements.clearDataButton.disabled = state.loading || !state.databaseConnected;
  elements.changeDataButton.disabled = state.loading;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function normalizeIncomingRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => ({
    id: String(row.id || `row-${index + 1}`),
    kode: String(row.kode || "-"),
    status_asli: String(row.status_asli || "-"),
    status_kategori: ["Akan Dilaksanakan", "Dalam Konfirmasi", "Dibatalkan"].includes(row.status_kategori)
      ? row.status_kategori
      : "Akan Dilaksanakan",
    jenis_pelatihan: String(row.jenis_pelatihan || "Lainnya"),
    pembiayaan: String(row.pembiayaan || "-"),
    lokasi: String(row.lokasi || "Belum ditentukan"),
    jumlah_kelas: Number.isFinite(Number(row.jumlah_kelas)) ? Math.max(1, Number(row.jumlah_kelas)) : 1,
    judul_pelatihan: String(row.judul_pelatihan || "Tanpa judul"),
    tanggal_mulai: String(row.tanggal_mulai || ""),
    akhir_tm: row.akhir_tm ? String(row.akhir_tm) : null
  })).filter((row) => parseDateOnly(row.tanggal_mulai));
}

function normalizeMeta(meta) {
  return {
    fileName: String(meta?.file_name || meta?.fileName || ""),
    sheetName: String(meta?.sheet_name || meta?.sheetName || ""),
    uploadedAt: String(meta?.uploaded_at || meta?.uploadedAt || "")
  };
}

function savePreference() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      periodPreset: state.periodPreset
    }));
  } catch (error) {
    // Preference storage is optional; the dashboard still works without it.
  }
}

function loadPreference() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return String(parsed.periodPreset || "");
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return "";
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) sessionStorage.removeItem(ADMIN_KEY_SESSION);
    throw new Error(payload.detail || payload.message || "Permintaan gagal diproses.");
  }
  return payload;
}

function resetFilters() {
  state.statusFilter = "all";
  state.locationFilter = "all";
  state.search = "";
}

async function loadPeriod(period, { showToastAfter = false } = {}) {
  if (!period) {
    state.rows = [];
    state.highlightNote = "";
    renderAll();
    return;
  }

  state.loading = true;
  state.periodPreset = period;
  renderAll();

  try {
    const query = period === "all" ? "" : `?week_start=${encodeURIComponent(period)}`;
    const payload = await requestJson(`/api/trainings${query}`);
    state.rows = normalizeIncomingRows(payload.rows);
    state.highlightNote = String(payload.note || "").trim().slice(0, 500);
    state.meta = normalizeMeta(payload.meta);
    state.uploadProtected = Boolean(payload.upload_protected);
    state.databaseConnected = true;
    resetFilters();
    savePreference();
    if (showToastAfter) showToast("Data terbaru berhasil dimuat dari NeonDB.");
  } catch (error) {
    state.rows = [];
    state.highlightNote = "";
    showToast(error.message || "Data gagal dimuat dari NeonDB.", "error");
  } finally {
    state.loading = false;
    renderAll();
  }
}

async function loadWeeksFromDatabase(preferredPeriod = "", { showToastAfter = false } = {}) {
  state.loading = true;
  renderAll();

  try {
    const payload = await requestJson("/api/weeks");
    state.weeks = Array.isArray(payload.weeks) ? payload.weeks : [];
    state.meta = normalizeMeta(payload.meta);
    state.uploadProtected = Boolean(payload.upload_protected);
    state.databaseConnected = true;
    const chosen = chooseDefaultPeriod(state.weeks, preferredPeriod);
    state.loading = false;

    if (chosen) {
      await loadPeriod(chosen, { showToastAfter });
      return;
    }

    state.periodPreset = "";
    state.rows = [];
    state.highlightNote = "";
    resetFilters();
    renderAll();
    window.setTimeout(showUploadModal, 180);
  } catch (error) {
    state.loading = false;
    state.databaseConnected = false;
    state.weeks = [];
    state.rows = [];
    state.highlightNote = "";
    renderAll();
    showToast(error.message || "NeonDB tidak dapat diakses.", "error");
  }
}

function buildExportFilename() {
  const period = state.periodPreset && state.periodPreset !== "all"
    ? state.periodPreset
    : "semua-data";
  return `dashboard-pelatihan-${period}.png`;
}

async function exportDashboardAsPng() {
  if (typeof window.html2canvas !== "function") {
    showToast("Fitur export PNG belum siap. Muat ulang halaman lalu coba lagi.", "error");
    return;
  }

  const target = document.querySelector(".main-content");
  if (!target) return;

  const button = elements.exportPngButton;
  const label = button.querySelector("span");
  const originalLabel = label?.textContent || "Export PNG";
  const previousX = window.scrollX;
  const previousY = window.scrollY;

  button.disabled = true;
  if (label) label.textContent = "Menyiapkan...";
  document.body.classList.add("exporting-dashboard");

  try {
    window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // Capture hanya area dashboard (.main-content), sehingga toolbar/sidebar kiri
    // tidak menambah lebar maupun ikut masuk ke file PNG.
    const width = target.scrollWidth;
    const height = target.scrollHeight;

    // Export HD: target 3x agar teks dan garis tetap tajam saat PNG dibuka/di-zoom.
    // Skala diturunkan otomatis hanya bila halaman sangat panjang agar browser tidak kehabisan memori.
    await (document.fonts?.ready || Promise.resolve());
    const desiredScale = 3;
    const maxCanvasDimension = 30000;
    const maxCanvasPixels = 120000000;
    const dimensionScale = Math.min(maxCanvasDimension / width, maxCanvasDimension / height);
    const pixelScale = Math.sqrt(maxCanvasPixels / Math.max(1, width * height));
    const scale = Math.max(1.5, Math.min(desiredScale, dimensionScale, pixelScale));

    const canvas = await window.html2canvas(target, {
      backgroundColor: "#f3f6fb",
      scale,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      onclone: (clonedDocument) => {
        const clonedBody = clonedDocument.body;
        clonedBody.classList.add("exporting-dashboard");
        clonedDocument.querySelectorAll(".modal, .toast, .mobile-backdrop").forEach((node) => {
          node.style.display = "none";
        });

        const clonedSidebar = clonedDocument.querySelector(".sidebar");
        if (clonedSidebar) clonedSidebar.style.display = "none";

        const clonedMain = clonedDocument.querySelector(".main-content");
        if (clonedMain) {
          clonedMain.style.marginLeft = "0";
          clonedMain.style.width = "100%";
          clonedMain.style.minHeight = `${height}px`;
        }
      },
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("PNG tidak dapat dibuat.");

    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = objectUrl;
    downloadLink.download = buildExportFilename();
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    showToast(`Dashboard berhasil diekspor sebagai PNG HD (${scale.toFixed(1)}x) tanpa toolbar.`);
  } catch (error) {
    console.error(error);
    showToast("Export PNG gagal. Coba ulangi setelah halaman selesai dimuat.", "error");
  } finally {
    document.body.classList.remove("exporting-dashboard");
    window.scrollTo(previousX, previousY);
    button.disabled = false;
    if (label) label.textContent = originalLabel;
  }
}

function showUploadModal() {
  elements.uploadModal.hidden = false;
  document.body.style.overflow = "hidden";
  resetUploadFeedback();
  elements.adminKeyGroup.hidden = !state.uploadProtected;
  elements.adminKeyInput.value = sessionStorage.getItem(ADMIN_KEY_SESSION) || "";
}

function closeUploadModal() {
  elements.uploadModal.hidden = true;
  document.body.style.overflow = "";
}

function updateHighlightCharacterCount() {
  elements.highlightCharacterCount.textContent = String(elements.highlightTextInput.value.length);
}

function showHighlightModal() {
  if (!state.periodPreset || state.periodPreset === "all") {
    showToast("Pilih satu minggu untuk menambah catatan.", "error");
    return;
  }
  elements.highlightTextInput.value = state.highlightNote;
  updateHighlightCharacterCount();
  elements.clearHighlightButton.disabled = !state.highlightNote;
  elements.highlightModal.hidden = false;
  document.body.style.overflow = "hidden";
  window.setTimeout(() => elements.highlightTextInput.focus(), 80);
}

function closeHighlightModal() {
  elements.highlightModal.hidden = true;
  document.body.style.overflow = "";
}

function getAdminKey({ promptIfMissing = false } = {}) {
  let key = String(elements.adminKeyInput?.value || sessionStorage.getItem(ADMIN_KEY_SESSION) || "").trim();
  if (!key && state.uploadProtected && promptIfMissing) {
    key = String(window.prompt("Masukkan kunci admin untuk menyimpan perubahan:") || "").trim();
  }
  if (key) sessionStorage.setItem(ADMIN_KEY_SESSION, key);
  return key;
}

function adminHeaders({ includeJson = false, promptIfMissing = false } = {}) {
  const headers = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  const key = getAdminKey({ promptIfMissing });
  if (key) headers["X-Admin-Key"] = key;
  return headers;
}

async function saveHighlightNote() {
  if (!state.periodPreset || state.periodPreset === "all") return;
  const note = elements.highlightTextInput.value.trim().slice(0, 500);
  elements.saveHighlightButton.disabled = true;
  try {
    await requestJson(`/api/notes/${encodeURIComponent(state.periodPreset)}`, {
      method: "PUT",
      headers: adminHeaders({ includeJson: true, promptIfMissing: true }),
      body: JSON.stringify({ note })
    });
    state.highlightNote = note;
    renderAll();
    closeHighlightModal();
    showToast(note ? "Catatan highlight berhasil disimpan ke NeonDB." : "Catatan highlight dikosongkan.");
  } catch (error) {
    showToast(error.message || "Catatan gagal disimpan.", "error");
  } finally {
    elements.saveHighlightButton.disabled = false;
  }
}

async function clearHighlightNote() {
  if (!state.periodPreset || state.periodPreset === "all") return;
  const confirmed = window.confirm("Hapus catatan tambahan pada minggu ini dari NeonDB?");
  if (!confirmed) return;

  elements.clearHighlightButton.disabled = true;
  try {
    await requestJson(`/api/notes/${encodeURIComponent(state.periodPreset)}`, {
      method: "DELETE",
      headers: adminHeaders({ promptIfMissing: true })
    });
    state.highlightNote = "";
    elements.highlightTextInput.value = "";
    updateHighlightCharacterCount();
    renderAll();
    closeHighlightModal();
    showToast("Catatan highlight sudah dihapus dari NeonDB.");
  } catch (error) {
    showToast(error.message || "Catatan gagal dihapus.", "error");
  } finally {
    elements.clearHighlightButton.disabled = false;
  }
}

function showDetailModal(row) {
  elements.detailStatus.textContent = row.status_kategori;
  elements.detailStatus.className = `status-badge ${statusClass(row.status_kategori)}`;
  elements.detailTitle.textContent = row.judul_pelatihan;
  elements.detailSubtitle.textContent = `Kode ${row.kode} • ${row.jenis_pelatihan}`;

  const detailItems = [
    ["Status dari file", row.status_asli],
    ["Pembiayaan", row.pembiayaan],
    ["Lokasi", row.lokasi],
    ["Jumlah kelas", String(row.jumlah_kelas)],
    ["Tanggal mulai", formatDate(row.tanggal_mulai)],
    ["Akhir TM", formatDate(row.akhir_tm)]
  ];

  elements.detailGrid.innerHTML = detailItems.map(([label, value]) => `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value || "-")}</dd>
    </div>
  `).join("");

  elements.detailModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDetailModal() {
  elements.detailModal.hidden = true;
  document.body.style.overflow = "";
}

function resetUploadFeedback() {
  elements.selectedFileName.textContent = "";
  elements.uploadMessage.textContent = "";
  elements.uploadMessage.className = "upload-message";
  elements.uploadProgress.hidden = true;
  elements.fileInput.value = "";
}

function setUploadState({ loading = false, message = "", type = "" } = {}) {
  elements.uploadProgress.hidden = !loading;
  elements.uploadMessage.textContent = message;
  elements.uploadMessage.className = `upload-message${type ? ` ${type}` : ""}`;
  elements.chooseFileButton.disabled = loading;
}

async function uploadFile(file) {
  if (!file) return;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(extension)) {
    setUploadState({ message: "Format file harus XLSX, XLS, atau CSV.", type: "error" });
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    setUploadState({ message: "Ukuran file melebihi batas 4 MB pada Vercel.", type: "error" });
    return;
  }

  const adminKey = getAdminKey();
  if (state.uploadProtected && !adminKey) {
    setUploadState({ message: "Masukkan kunci admin sebelum mengunggah data.", type: "error" });
    elements.adminKeyInput.focus();
    return;
  }

  elements.selectedFileName.textContent = file.name;
  setUploadState({ loading: true, message: "Memproses file dan memperbarui NeonDB berdasarkan Kode Diklat..." });

  const formData = new FormData();
  formData.append("file", file);
  const headers = {};
  if (adminKey) headers["X-Admin-Key"] = adminKey;

  try {
    const payload = await requestJson("/api/upload", {
      method: "POST",
      headers,
      body: formData
    });
    if (adminKey) sessionStorage.setItem(ADMIN_KEY_SESSION, adminKey);
    const processed = Number(payload.processed_count || payload.row_count || 0);
    const inserted = Number(payload.inserted_count || 0);
    const updated = Number(payload.updated_count || 0);
    const skipped = Number(payload.skipped_count || 0);
    const totalDatabaseRows = Number(payload.total_database_rows || 0);
    const summary = [
      `${processed} data diproses`,
      `${inserted} data baru`,
      `${updated} data diperbarui`
    ];
    if (skipped > 0) summary.push(`${skipped} data dilewati`);

    setUploadState({
      message: `${summary.join(" • ")}. Total database: ${totalDatabaseRows} data.`,
      type: "success"
    });
    closeUploadModal();
    await loadWeeksFromDatabase(String(payload.default_week || ""));

    const warningText = Array.isArray(payload.warnings) && payload.warnings.length
      ? ` ${payload.warnings.join(" ")}`
      : "";
    showToast(`Update ${file.name} berhasil: ${summary.join(" • ")}.${warningText}`);
  } catch (error) {
    setUploadState({ message: error.message || "File gagal diproses.", type: "error" });
  } finally {
    elements.uploadProgress.hidden = true;
    elements.chooseFileButton.disabled = false;
  }
}

async function reloadDatabase() {
  await loadWeeksFromDatabase(state.periodPreset, { showToastAfter: true });
}

function showToast(message, type = "success") {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast${type === "error" ? " error" : ""}`;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 5200);
}

function openMobileMenu() {
  elements.sidebar.classList.add("open");
  elements.mobileBackdrop.hidden = false;
}

function closeMobileMenu() {
  elements.sidebar.classList.remove("open");
  elements.mobileBackdrop.hidden = true;
}

function attachEvents() {
  document.querySelectorAll("[data-action='upload']").forEach((button) => {
    button.addEventListener("click", () => {
      closeMobileMenu();
      showUploadModal();
    });
  });

  document.querySelectorAll("[data-action='dashboard']").forEach((button) => {
    button.addEventListener("click", () => {
      closeMobileMenu();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  elements.exportPngButton.addEventListener("click", exportDashboardAsPng);
  elements.changeDataButton.addEventListener("click", showUploadModal);
  elements.menuButton.addEventListener("click", openMobileMenu);
  elements.mobileBackdrop.addEventListener("click", closeMobileMenu);

  elements.periodPreset.addEventListener("change", async (event) => {
    await loadPeriod(event.target.value);
  });

  elements.statusFilter.addEventListener("change", (event) => {
    state.statusFilter = event.target.value;
    renderTable();
  });

  elements.locationFilter.addEventListener("change", (event) => {
    state.locationFilter = event.target.value;
    renderTable();
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderTable();
  });

  elements.trainingTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-detail-id]");
    if (!button) return;
    const row = state.rows.find((item) => item.id === button.dataset.detailId);
    if (row) showDetailModal(row);
  });

  elements.highlightEditButton.addEventListener("click", showHighlightModal);
  elements.highlightCloseButton.addEventListener("click", closeHighlightModal);
  elements.cancelHighlightButton.addEventListener("click", closeHighlightModal);
  elements.saveHighlightButton.addEventListener("click", saveHighlightNote);
  elements.clearHighlightButton.addEventListener("click", clearHighlightNote);
  elements.highlightTextInput.addEventListener("input", updateHighlightCharacterCount);
  document.querySelectorAll("[data-close-highlight]").forEach((element) => {
    element.addEventListener("click", closeHighlightModal);
  });

  elements.uploadCloseButton.addEventListener("click", closeUploadModal);
  document.querySelectorAll("[data-close-upload]").forEach((element) => {
    element.addEventListener("click", closeUploadModal);
  });
  elements.detailCloseButton.addEventListener("click", closeDetailModal);
  document.querySelectorAll("[data-close-detail]").forEach((element) => {
    element.addEventListener("click", closeDetailModal);
  });

  elements.chooseFileButton.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", (event) => uploadFile(event.target.files?.[0]));
  elements.clearDataButton.addEventListener("click", reloadDatabase);

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.remove("dragover");
    });
  });

  elements.dropzone.addEventListener("drop", (event) => {
    uploadFile(event.dataTransfer?.files?.[0]);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!elements.detailModal.hidden) closeDetailModal();
    else if (!elements.highlightModal.hidden) closeHighlightModal();
    else if (!elements.uploadModal.hidden) closeUploadModal();
    else closeMobileMenu();
  });
}

async function init() {
  cacheElements();
  attachEvents();
  renderAll();
  await loadWeeksFromDatabase();
}

document.addEventListener("DOMContentLoaded", init);
