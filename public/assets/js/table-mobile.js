(() => {
  const toggleRows = () => {
    document.querySelectorAll('.js-row-toggle').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const container = btn.closest('.border, .card, tr') || btn.parentElement;
        let details = null;

        if (container) {
          details = container.querySelector('.row-details');
        }

        // fallback: next sibling (tabla mobile con <tr> detalle)
        if (!details) {
          const row = btn.closest('tr');
          if (row && row.nextElementSibling?.classList.contains('row-details')) {
            details = row.nextElementSibling;
          }
        }

        if (!details) return;

        details.classList.toggle('d-none');
        btn.classList.toggle('btn-outline-secondary');
        btn.classList.toggle('btn-secondary');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.classList.toggle('bi-chevron-down');
          icon.classList.toggle('bi-chevron-up');
        }
      });
    });
  };

  const init = () => toggleRows();

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('htmx:afterSwap', init);
})();
