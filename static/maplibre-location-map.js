import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const INDONESIA_BOUNDS = [[94.3, -11.6], [141.5, 6.8]];

let trainingMap = null;
let mapLoaded = false;
let lastGeoJson = { type: 'FeatureCollection', features: [] };

const CITY_COORDS = {
  // Special GIA / common aliases
  'pusdiklatwas': [106.8060, -6.5950],
  'kab bogor': [106.8060, -6.5950],
  'kabupaten bogor': [106.8060, -6.5950],
  'bogor': [106.8060, -6.5950],
  'ciawi': [106.8519, -6.7410],
  'balai medan': [98.6722, 3.5952],
  'balai bali': [115.2167, -8.6705],
  'balai denpasar': [115.2167, -8.6705],
  'balai makassar': [119.4327, -5.1477],
  'balai yogyakarta': [110.3695, -7.7956],

  // Sumatra
  'banda aceh': [95.3238, 5.5483], 'sabang': [95.3214, 5.8933], 'lhokseumawe': [97.1426, 5.1801],
  'medan': [98.6722, 3.5952], 'binjai': [98.4854, 3.6001], 'pematangsiantar': [99.0682, 2.9595],
  'padang': [100.3543, -0.9471], 'bukittinggi': [100.3692, -0.3050],
  'pekanbaru': [101.4478, 0.5071], 'dumai': [101.4520, 1.6660],
  'jambi': [103.6131, -1.6101], 'palembang': [104.7754, -2.9761], 'lubuklinggau': [102.8615, -3.2967],
  'bengkulu': [102.2655, -3.8004], 'bandar lampung': [105.2668, -5.3971], 'metro': [105.3067, -5.1135],
  'pangkalpinang': [106.1096, -2.1316], 'tanjungpinang': [104.4500, 0.9186], 'batam': [104.0305, 1.0456],

  // Java & Banten/DKI
  'jakarta': [106.8456, -6.2088], 'jakarta pusat': [106.8272, -6.1865], 'jakarta selatan': [106.8106, -6.2615],
  'jakarta timur': [106.9004, -6.2250], 'jakarta barat': [106.7588, -6.1683], 'jakarta utara': [106.8570, -6.1384],
  'depok': [106.7942, -6.4025], 'bekasi': [107.0018, -6.2383], 'tangerang': [106.6319, -6.1783],
  'tangerang selatan': [106.7085, -6.2886], 'serang': [106.1503, -6.1201], 'cilegon': [106.0517, -6.0025],
  'bandung': [107.6191, -6.9175], 'cimahi': [107.5423, -6.8722], 'sukabumi': [106.9271, -6.9277],
  'cirebon': [108.5523, -6.7320], 'tasikmalaya': [108.2207, -7.3274], 'banjar': [108.5389, -7.3707],
  'semarang': [110.4203, -6.9932], 'surakarta': [110.8279, -7.5755], 'solo': [110.8279, -7.5755],
  'salatiga': [110.4931, -7.3305], 'magelang': [110.2177, -7.4706], 'pekalongan': [109.6753, -6.8898], 'tegal': [109.1256, -6.8694],
  'yogyakarta': [110.3695, -7.7956], 'jogja': [110.3695, -7.7956],
  'surabaya': [112.7521, -7.2575], 'malang': [112.6304, -7.9666], 'batu': [112.5239, -7.8671],
  'kediri': [112.0114, -7.8480], 'madiun': [111.5239, -7.6297], 'mojokerto': [112.4336, -7.4726],
  'probolinggo': [113.2037, -7.7543], 'pasuruan': [112.9065, -7.6450], 'blitar': [112.1681, -8.0955],

  // Bali & Nusa Tenggara
  'denpasar': [115.2167, -8.6705], 'mataram': [116.1005, -8.5833], 'bima': [118.7274, -8.4606], 'kupang': [123.6070, -10.1772],

  // Kalimantan
  'pontianak': [109.3425, -0.0263], 'singkawang': [108.9872, 0.9060],
  'palangkaraya': [113.9213, -2.2096], 'palangka raya': [113.9213, -2.2096],
  'banjarmasin': [114.5910, -3.3186], 'banjarbaru': [114.8320, -3.4420],
  'samarinda': [117.1537, -0.5022], 'balikpapan': [116.8529, -1.2379], 'tarakan': [117.6336, 3.3000],
  'nusantara': [116.6830, -0.9720], 'ikn': [116.6830, -0.9720],

  // Sulawesi
  'manado': [124.8421, 1.4748], 'bitung': [125.1824, 1.4451], 'tomohon': [124.8389, 1.3229],
  'gorontalo': [123.0595, 0.5435], 'palu': [119.8707, -0.8986],
  'makassar': [119.4327, -5.1477], 'parepare': [119.6236, -4.0096], 'palopo': [120.1973, -2.9945],
  'kendari': [122.5149, -3.9985], 'baubau': [122.6167, -5.4667],

  // Maluku & Papua
  'ambon': [128.1814, -3.6547], 'tual': [132.7483, -5.6660], 'ternate': [127.3777, 0.7901], 'tidore': [127.4045, 0.6749],
  'jayapura': [140.7181, -2.5916], 'sorong': [131.2500, -0.8762], 'manokwari': [134.0620, -0.8615],
  'merauke': [140.3945, -8.4991], 'nabire': [135.5016, -3.3634]
};

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/kab\.?/g, 'kab ')
    .replace(/kota\s+/g, '')
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveCoordinates(text) {
  const value = normalize(text);
  if (!value || value.includes('pjj') || value.includes('virtual') || value === 'lainnya') return null;

  if (CITY_COORDS[value]) return CITY_COORDS[value];

  // Prefer the longest matching alias so "balai denpasar" wins over "denpasar".
  const keys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (value.includes(key)) return CITY_COORDS[key];
  }
  return null;
}

function parseCount(text) {
  const matches = [...String(text || '').matchAll(/(\d+)\s*kelas/gi)];
  if (matches.length) return Number(matches[matches.length - 1][1]);
  const nums = String(text || '').match(/\b\d+\b/g);
  return nums?.length ? Number(nums[nums.length - 1]) : 0;
}

function extractLocationRows() {
  const list = document.getElementById('locationMapList');
  if (!list) return [];

  return [...list.children].map((row) => {
    const strongs = [...row.querySelectorAll('strong')].map((el) => el.textContent.trim()).filter(Boolean);
    const spans = [...row.querySelectorAll('span')].map((el) => el.textContent.trim()).filter(Boolean);
    const text = row.innerText.replace(/\s+/g, ' ').trim();
    const count = parseCount(text);

    // The first strong is the displayed location in the existing V5.14/V5.15 list.
    const displayName = strongs[0] || text.replace(/\b\d+\s*kelas\b/gi, '').trim();
    const secondary = spans.find((v) => v && !/kelas/i.test(v) && normalize(v) !== normalize(displayName)) || '';
    const lookupText = `${displayName} ${secondary} ${text}`;
    const coords = resolveCoordinates(lookupText);

    return { displayName, secondary, count, coords };
  }).filter((item) => item.count > 0 && item.coords);
}

function toGeoJson(rows) {
  return {
    type: 'FeatureCollection',
    features: rows.map((item) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: item.coords },
      properties: {
        label: item.displayName,
        secondary: item.secondary,
        count: item.count
      }
    }))
  };
}

function updateMapData() {
  const rows = extractLocationRows();
  lastGeoJson = toGeoJson(rows);
  if (!trainingMap || !mapLoaded) return;
  const source = trainingMap.getSource('training-locations');
  if (source) source.setData(lastGeoJson);
}

function setIndonesiaViewport() {
  if (!trainingMap) return;
  trainingMap.fitBounds(INDONESIA_BOUNDS, {
    padding: { top: 18, right: 20, bottom: 18, left: 20 },
    duration: 0,
    maxZoom: 4.25
  });
}

function initMap() {
  const container = document.getElementById('trainingMap');
  const wrap = container?.closest('.indonesia-map-wrap');
  if (!container || !wrap || trainingMap) return;

  trainingMap = new maplibregl.Map({
    container,
    style: MAP_STYLE,
    center: [118, -2.4],
    zoom: 3.15,
    minZoom: 2.6,
    maxZoom: 9,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    canvasContextAttributes: { preserveDrawingBuffer: true }
  });

  trainingMap.scrollZoom.disable();
  trainingMap.touchZoomRotate.disableRotation();
  trainingMap.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  trainingMap.on('load', () => {
    mapLoaded = true;
    trainingMap.addSource('training-locations', { type: 'geojson', data: lastGeoJson });

    trainingMap.addLayer({
      id: 'training-location-circles',
      type: 'circle',
      source: 'training-locations',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 7, 3, 9, 6, 11, 10, 14],
        'circle-color': '#0b3b78',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2.5,
        'circle-opacity': 0.94
      }
    });

    trainingMap.addLayer({
      id: 'training-location-counts',
      type: 'symbol',
      source: 'training-locations',
      layout: {
        'text-field': ['to-string', ['get', 'count']],
        'text-size': 10,
        'text-font': ['Noto Sans Bold'],
        'text-allow-overlap': true,
        'text-ignore-placement': true
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(255,255,255,0)',
        'text-halo-width': 0
      }
    });

    trainingMap.on('click', 'training-location-circles', (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const p = feature.properties || {};
      new maplibregl.Popup({ offset: 12, closeButton: true, closeOnClick: true })
        .setLngLat(feature.geometry.coordinates)
        .setHTML(`<strong>${escapeHtml(p.label || 'Lokasi')}</strong><span>${escapeHtml(p.secondary || '')}${p.secondary ? '<br>' : ''}${Number(p.count || 0)} kelas</span>`)
        .addTo(trainingMap);
    });

    trainingMap.on('mouseenter', 'training-location-circles', () => { trainingMap.getCanvas().style.cursor = 'pointer'; });
    trainingMap.on('mouseleave', 'training-location-circles', () => { trainingMap.getCanvas().style.cursor = ''; });

    setIndonesiaViewport();
    updateMapData();
    wrap.classList.add('maplibre-ready');
  });

  trainingMap.on('error', (event) => {
    // Do not remove the legacy SVG fallback if the basemap fails.
    console.warn('MapLibre/OpenFreeMap map error:', event?.error || event);
  });

  const resizeObserver = new ResizeObserver(() => {
    if (!trainingMap) return;
    trainingMap.resize();
    setIndonesiaViewport();
  });
  resizeObserver.observe(wrap);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function observeExistingLocationList() {
  const list = document.getElementById('locationMapList');
  if (!list) return;
  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(updateMapData);
  });
  observer.observe(list, { childList: true, subtree: true, characterData: true });
}

function prepareMapBeforeExport() {
  if (!trainingMap || !mapLoaded) return;
  trainingMap.resize();
  setIndonesiaViewport();
  // Force a repaint while preserveDrawingBuffer=true so html2canvas can read the WebGL canvas.
  trainingMap.triggerRepaint();
}

function bootstrap() {
  initMap();
  observeExistingLocationList();
  updateMapData();

  const exportButton = document.getElementById('exportPngButton');
  exportButton?.addEventListener('click', prepareMapBeforeExport, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
