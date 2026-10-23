// V5.17 — mirror the existing Kelas Terbanyak narrative into the type card.
(function () {
  function syncTypeInsight() {
    const source = document.getElementById('highlightType');
    const target = document.getElementById('typeInsightText');
    if (!target) return;

    const value = source && source.textContent ? source.textContent.trim() : '';
    target.textContent = value || 'Belum ada data.';
  }

  function init() {
    syncTypeInsight();

    const source = document.getElementById('highlightType');
    if (source && 'MutationObserver' in window) {
      const observer = new MutationObserver(syncTypeInsight);
      observer.observe(source, { childList: true, subtree: true, characterData: true });
    }

    // The dashboard may refresh its data after a week/filter change.
    document.addEventListener('change', function () {
      window.setTimeout(syncTypeInsight, 80);
    });

    document.addEventListener('click', function () {
      window.setTimeout(syncTypeInsight, 120);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
