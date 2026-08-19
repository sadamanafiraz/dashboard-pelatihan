"use strict";

const STORAGE_KEY = "dashboard-pelatihan-v1";
const LOCATION_COLORS = ["#0b2f6b", "#1f63b5", "#d71920", "#ec5b62", "#6689ca", "#9fb4dc"];
const STATUS_SORT_ORDER = Object.freeze({
  "Akan Dilaksanakan": 0,
  "Dalam Konfirmasi": 1,
  "Dibatalkan": 2
});

const DEMO_ROWS = [
  {
    id: "demo-322",
    kode: "322",
    status_asli: "Realisasi",
    status_kategori: "Akan Dilaksanakan",
    jenis_pelatihan: "JFA",
    pembiayaan: "PNBP",
    lokasi: "PJJ",
    jumlah_kelas: 1,
    judul_pelatihan: "Penjenjangan Auditor Ahli Muda",
    tanggal_mulai: "2026-08-20",
    akhir_tm: "2026-09-25"
  },
  {
    id: "demo-746",
    kode: "746",
    status_asli: "Realisasi",
    status_kategori: "Akan Dilaksanakan",
    jenis_pelatihan: "JFA",
    pembiayaan: "PNBP",
    lokasi: "Kab/Kota Bogor",
    jumlah_kelas: 1,
    judul_pelatihan: "Pelatihan Fungsional Auditor Ahli Pertama di Lingkungan Inspektorat Utama Badan Intelijen Negara (BIN)",
    tanggal_mulai: "2026-08-18",
    akhir_tm: "2026-09-24"
  },
  {
    id: "demo-640",
    kode: "640",
    status_asli: "Realisasi",
    status_kategori: "Akan Dilaksanakan",
    jenis_pelatihan: "SN-FA",
    pembiayaan: "PNBP",
    lokasi: "Pusdiklatwas",
    jumlah_kelas: 1,
    judul_pelatihan: "Pelatihan dan Sertifikasi CGRE",
    tanggal_mulai: "2026-08-18",
    akhir_tm: "2026-08-20"
  },
  {
    id: "demo-740",
    kode: "740",
    status_asli: "Realisasi",
    status_kategori: "Akan Dilaksanakan",
    jenis_pelatihan: "SN-FA",
    pembiayaan: "ABT",
    lokasi: "Pusdiklatwas",
    jumlah_kelas: 1,
    judul_pelatihan: "Pelatihan dan Sertifikasi CCRA di Lingkungan BPKP",
    tanggal_mulai: "2026-08-18",
    akhir_tm: "2026-09-02"
  },
  {
    id: "demo-742",
    kode: "742",
    status_asli: "Realisasi",
    status_kategori: "Akan Dilaksanakan",
    jenis_pelatihan: "SN-FA",
    pembiayaan: "ABT",
    lokasi: "Pusdiklatwas",
    jumlah_kelas: 1,
    judul_pelatihan: "Pelatihan dan Sertifikasi CGRS di Lingkungan BPKP",
    tanggal_mulai: "2026-08-20",
    akhir_tm: "2026-08-27"
  },
  {
    id: "demo-752",
    kode: "752",
    status_asli: "Realisasi",
    status_kategori: "Akan Dilaksanakan",
    jenis_pelatihan: "JFA",
    pembiayaan: "PNBP",
    lokasi: "Ternate",
    jumlah_kelas: 1,
    judul_pelatihan: "Pelatihan Fungsional Auditor Ahli Pertama di Lingkungan Pemerintah Daerah Wilayah Provinsi Maluku Utara",
    tanggal_mulai: "2026-08-18",
    akhir_tm: "2026-09-17"
  },
  {
    id: "demo-707",
    kode: "707",
    status_asli: "Dibatalkan",
    status_kategori: "Dibatalkan",
    jenis_pelatihan: "JFA",
    pembiayaan: "PNBP",
    lokasi: "Balai Medan",
    jumlah_kelas: 1,
    judul_pelatihan: "Pelatihan Fungsional Auditor Ahli Muda di Lingkungan Kejaksaan Agung Batch 2",
    tanggal_mulai: "2026-08-18",
    akhir_tm: "2026-09-24"
  },
  {
    id: "demo-717",
    kode: "717",
    status_asli: "Realisasi",
    status_kategori: "Akan Dilaksanakan",
    jenis_pelatihan: "JFA",
    pembiayaan: "PNBP",
    lokasi: "Pusdiklatwas",
    jumlah_kelas: 1,
    judul_pelatihan: "Pelatihan Fungsional Auditor Ahli Pertama di Lingkungan Kejaksaan Agung Batch 2",
    tanggal_mulai: "2026-08-18",
    akhir_tm: "2026-09-24"
  },
  {
    id: "demo-696",
    kode: "696",
    status_asli: "Dalam Konfirmasi",
    status_kategori: "Dalam Konfirmasi",
    jenis_pelatihan: "JFA",
    pembiayaan: "PNBP",
    lokasi: "Pekanbaru",
    jumlah_kelas: 1,
    judul_pelatihan: "Pelatihan Fungsional Auditor Ahli Pertama di Lingkungan Inspektorat Kabupaten Kampar",
    tanggal_mulai: "2026-08-20",
    akhir_tm: "2026-09-24"
  }
];

const state = {
  rows: [],
  meta: {
    fileName: "",
    sheetName: "",
    uploadedAt: ""
  },
  periodPreset: "data",
  customStart: "",
  customEnd: "",
  statusFilter: "all",
  locationFilter: "all",
  search: "",
  highlightNote: ""
};

const elements = {};
let toastTimer = null;

function cacheElements() {
  const ids = [
    "sidebar", "mobileBackdrop", "menuButton", "periodPreset", "periodLabel",
    "lastUpdated", "changeDataButton", "customPeriodPanel", "customStartDate",
    "customEndDate", "applyCustomPeriod", "kpiTotal", "kpiTotalTrainingCount", "kpiScheduled",
    "kpiScheduledTrainingCount", "kpiConfirmation", "kpiCancelled",
    "confirmationProgress", "cancelledProgress", "confirmationPercent", "cancelledPercent",
    "donutSegments", "donutTotal", "locationLegend", "typeBars", "highlightType",
    "highlightLocation", "highlightEditButton", "highlightCustomText", "customHighlightItem",
    "customHighlightDivider", "datasetLabel", "statusFilter", "locationFilter", "searchInput",
    "trainingTableBody", "emptyTable", "paginationInfo", "uploadModal", "uploadCloseButton",
    "dropzone", "fileInput", "selectedFileName", "uploadProgress", "uploadMessage",
    "clearDataButton", "demoDataButton", "chooseFileButton", "highlightModal",
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

function endOfWeek(sourceDate, offsetWeeks = 0) {
  const start = startOfWeek(sourceDate, offsetWeeks);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
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
  if (!state.rows.length || state.periodPreset === "all") {
    return { start: null, end: null };
  }

  if (state.periodPreset === "current-week") {
    const now = new Date();
    return { start: startOfWeek(now), end: endOfWeek(now) };
  }

  if (state.periodPreset === "next-week") {
    const now = new Date();
    return { start: startOfWeek(now, 1), end: endOfWeek(now, 1) };
  }

  if (state.periodPreset === "custom") {
    return {
      start: parseDateOnly(state.customStart),
      end: parseDateOnly(state.customEnd)
    };
  }

  return getDataRange();
}

function getPeriodRows() {
  const { start, end } = getPeriodBounds();
  if (!start || !end) return [...state.rows];
  return state.rows.filter((row) => {
    const date = parseDateOnly(row.tanggal_mulai);
    return date && date >= start && date <= end;
  });
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

function compactGroups(groups, limit) {
  if (groups.length <= limit) return groups;
  const visible = groups.slice(0, limit - 1);
  const others = groups.slice(limit - 1).reduce((sum, item) => sum + item.value, 0);
  return [...visible, { label: "Lainnya", value: others }];
}

function formatPeriodLabel() {
  if (!state.rows.length) return "Belum ada data";
  if (state.periodPreset === "all") return "Semua tanggal";
  const { start, end } = getPeriodBounds();
  if (!start || !end) return "Rentang belum valid";
  return `${formatDate(toIsoDate(start))} – ${formatDate(toIsoDate(end))}`;
}

function chooseDefaultPeriod(rows) {
  const now = new Date();
  const nextStart = startOfWeek(now, 1);
  const nextEnd = endOfWeek(now, 1);
  const hasNextWeek = rows.some((row) => {
    const date = parseDateOnly(row.tanggal_mulai);
    return date && date >= nextStart && date <= nextEnd;
  });
  return hasNextWeek ? "next-week" : "data";
}

function renderPeriod() {
  elements.periodPreset.value = state.periodPreset;
  elements.periodLabel.textContent = formatPeriodLabel();
  elements.customPeriodPanel.hidden = state.periodPreset !== "custom";
  elements.customStartDate.value = state.customStart;
  elements.customEndDate.value = state.customEnd;
}

function renderHeader() {
  elements.lastUpdated.textContent = formatDateLong(state.meta.uploadedAt);
  if (!state.rows.length) {
    elements.datasetLabel.textContent = "Belum ada file yang diunggah.";
    return;
  }

  const parts = [state.meta.fileName || "Data pelatihan"];
  if (state.meta.sheetName) parts.push(`Sheet: ${state.meta.sheetName}`);
  parts.push(`${state.rows.length} baris`);
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
  const total = rows.length;
  const groups = compactGroups(countBy(rows, "lokasi"), 5);
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
  const groups = compactGroups(countBy(rows, "jenis_pelatihan"), 5);

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
  const types = countBy(rows, "jenis_pelatihan");
  const locations = countBy(rows, "lokasi");

  if (!rows.length) {
    elements.highlightType.textContent = "Belum ada data pada periode yang dipilih.";
    elements.highlightLocation.textContent = "Belum ada data pada periode yang dipilih.";
  } else {
    const topType = types[0];
    const topLocation = locations[0];
    elements.highlightType.textContent = `Jenis ${topType.label} mendominasi dengan ${topType.value} sesi pelatihan.`;
    elements.highlightLocation.textContent = `${topLocation.label} menjadi lokasi terbanyak dengan ${topLocation.value} sesi.`;
  }

  const hasCustomNote = Boolean(state.highlightNote.trim());
  elements.customHighlightItem.hidden = !hasCustomNote;
  elements.customHighlightDivider.hidden = !hasCustomNote;
  elements.highlightCustomText.textContent = hasCustomNote ? state.highlightNote : "";
  const buttonLabel = elements.highlightEditButton.querySelector("span");
  if (buttonLabel) buttonLabel.textContent = hasCustomNote ? "Edit Catatan" : "Tambah Catatan";
  elements.highlightEditButton.setAttribute(
    "aria-label",
    hasCustomNote ? "Edit catatan tambahan highlight" : "Tambah catatan highlight"
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
  elements.clearDataButton.disabled = !state.rows.length && !state.highlightNote;
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
    id: String(row.id || `row-${index + 1}-${Date.now()}`),
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

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      rows: state.rows,
      meta: state.meta,
      highlightNote: state.highlightNote
    }));
  } catch (error) {
    showToast("Data berhasil dimuat, tetapi terlalu besar untuk disimpan di browser.", "error");
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    state.highlightNote = String(parsed.highlightNote || "").trim().slice(0, 500);
    const rows = normalizeIncomingRows(parsed.rows);
    if (!rows.length) return false;
    state.rows = rows;
    state.meta = {
      fileName: String(parsed.meta?.fileName || "Data tersimpan"),
      sheetName: String(parsed.meta?.sheetName || ""),
      uploadedAt: String(parsed.meta?.uploadedAt || new Date().toISOString())
    };
    state.periodPreset = chooseDefaultPeriod(rows);
    return true;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    state.highlightNote = "";
    return false;
  }
}

function applyDataset(payload, fallbackName = "Data pelatihan") {
  const rows = normalizeIncomingRows(payload.rows);
  if (!rows.length) {
    throw new Error("Tidak ada data valid yang dapat ditampilkan.");
  }

  state.rows = rows;
  state.meta = {
    fileName: String(payload.file_name || payload.fileName || fallbackName),
    sheetName: String(payload.sheet_name || payload.sheetName || ""),
    uploadedAt: String(payload.uploaded_at || payload.uploadedAt || new Date().toISOString())
  };
  state.periodPreset = chooseDefaultPeriod(rows);
  state.customStart = "";
  state.customEnd = "";
  state.statusFilter = "all";
  state.locationFilter = "all";
  state.search = "";
  saveToStorage();
  renderAll();
}

function showUploadModal() {
  elements.uploadModal.hidden = false;
  document.body.style.overflow = "hidden";
  resetUploadFeedback();
}

function closeUploadModal() {
  elements.uploadModal.hidden = true;
  document.body.style.overflow = "";
}

function updateHighlightCharacterCount() {
  elements.highlightCharacterCount.textContent = String(elements.highlightTextInput.value.length);
}

function showHighlightModal() {
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

function saveHighlightNote() {
  state.highlightNote = elements.highlightTextInput.value.trim().slice(0, 500);
  saveToStorage();
  renderAll();
  closeHighlightModal();
  showToast(state.highlightNote ? "Catatan highlight berhasil disimpan." : "Catatan highlight dikosongkan.");
}

function clearHighlightNote() {
  if (!state.highlightNote && !elements.highlightTextInput.value.trim()) return;
  const confirmed = window.confirm("Hapus catatan tambahan pada highlight?");
  if (!confirmed) return;
  state.highlightNote = "";
  elements.highlightTextInput.value = "";
  updateHighlightCharacterCount();
  saveToStorage();
  renderAll();
  closeHighlightModal();
  showToast("Catatan highlight sudah dihapus.");
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
  elements.demoDataButton.disabled = loading;
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

  elements.selectedFileName.textContent = file.name;
  setUploadState({ loading: true, message: "Memproses file dan menyusun dashboard..." });

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || "File gagal diproses.");
    }

    applyDataset(payload, file.name);
    setUploadState({ message: `${payload.row_count || state.rows.length} baris berhasil dimuat.`, type: "success" });
    closeUploadModal();

    const warningText = Array.isArray(payload.warnings) && payload.warnings.length
      ? ` ${payload.warnings.join(" ")}`
      : "";
    showToast(`Data ${file.name} berhasil ditampilkan.${warningText}`);
  } catch (error) {
    setUploadState({ message: error.message || "File gagal diproses.", type: "error" });
  } finally {
    elements.uploadProgress.hidden = true;
    elements.chooseFileButton.disabled = false;
    elements.demoDataButton.disabled = false;
  }
}

function useDemoData() {
  applyDataset({
    fileName: "Data Contoh Pelatihan",
    sheetName: "Contoh",
    uploadedAt: new Date().toISOString(),
    rows: DEMO_ROWS
  });
  closeUploadModal();
  showToast("Data contoh berhasil dimuat. Gunakan tombol Ganti Data untuk mengunggah file Anda.");
}

function clearStoredData() {
  if (!state.rows.length && !state.highlightNote) return;
  const confirmed = window.confirm("Hapus data dashboard dan catatan tambahan yang tersimpan di browser ini?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  state.rows = [];
  state.meta = { fileName: "", sheetName: "", uploadedAt: "" };
  state.periodPreset = "data";
  state.customStart = "";
  state.customEnd = "";
  state.statusFilter = "all";
  state.locationFilter = "all";
  state.search = "";
  state.highlightNote = "";
  renderAll();
  setUploadState({ message: "Data dan catatan tersimpan sudah dihapus.", type: "success" });
}

function showToast(message, type = "success") {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast${type === "error" ? " error" : ""}`;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 4200);
}

function openMobileMenu() {
  elements.sidebar.classList.add("open");
  elements.mobileBackdrop.hidden = false;
}

function closeMobileMenu() {
  elements.sidebar.classList.remove("open");
  elements.mobileBackdrop.hidden = true;
}

function initializeCustomDates() {
  const range = getDataRange();
  if (!state.customStart && range.start) state.customStart = toIsoDate(range.start);
  if (!state.customEnd && range.end) state.customEnd = toIsoDate(range.end);
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

  elements.changeDataButton.addEventListener("click", showUploadModal);
  elements.menuButton.addEventListener("click", openMobileMenu);
  elements.mobileBackdrop.addEventListener("click", closeMobileMenu);

  elements.periodPreset.addEventListener("change", (event) => {
    state.periodPreset = event.target.value;
    if (state.periodPreset === "custom") initializeCustomDates();
    renderAll();
  });

  elements.applyCustomPeriod.addEventListener("click", () => {
    const start = elements.customStartDate.value;
    const end = elements.customEndDate.value;
    if (!start || !end) {
      showToast("Pilih tanggal awal dan akhir.", "error");
      return;
    }
    if (parseDateOnly(start) > parseDateOnly(end)) {
      showToast("Tanggal awal tidak boleh setelah tanggal akhir.", "error");
      return;
    }
    state.customStart = start;
    state.customEnd = end;
    renderAll();
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
  elements.demoDataButton.addEventListener("click", useDemoData);
  elements.clearDataButton.addEventListener("click", clearStoredData);

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

function init() {
  cacheElements();
  attachEvents();
  const hasStoredData = loadFromStorage();
  const demoMode = new URLSearchParams(window.location.search).get("demo") === "1";
  if (!hasStoredData && demoMode) {
    applyDataset({
      fileName: "Data Contoh Pelatihan",
      sheetName: "Contoh",
      uploadedAt: new Date().toISOString(),
      rows: DEMO_ROWS
    });
    return;
  }
  renderAll();
  if (!hasStoredData) {
    window.setTimeout(showUploadModal, 220);
  }
}

document.addEventListener("DOMContentLoaded", init);
