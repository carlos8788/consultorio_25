(() => {
  const buildHref = (page, paginationQuery) => {
    const params = new URLSearchParams(paginationQuery || '');
    params.set('page', page);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : window.location.pathname;
  };

  const createPageItem = (pageNumber, label, { disabled = false, active = false, small = false } = {}, paginationQuery) => {
    const li = document.createElement('li');
    li.className = ['page-item', disabled ? 'disabled' : '', active ? 'active' : ''].filter(Boolean).join(' ');

    const link = document.createElement('a');
    link.className = ['page-link', small ? 'px-3' : ''].filter(Boolean).join(' ');
    link.href = buildHref(pageNumber, paginationQuery);
    link.dataset.pageLink = 'true';
    link.dataset.page = String(pageNumber);
    link.textContent = label;

    li.appendChild(link);
    return li;
  };

  const createDots = (small = false) => {
    const li = document.createElement('li');
    li.className = 'page-item disabled';
    const span = document.createElement('span');
    span.className = ['page-link', small ? 'px-3' : ''].filter(Boolean).join(' ');
    span.textContent = '...';
    li.appendChild(span);
    return li;
  };

  const buildList = ({ page, pages, paginationQuery, small = false }) => {
    const ul = document.createElement('ul');
    ul.className = [
      'pagination',
      'pagination-sm',
      'justify-content-center',
      'align-items-center',
      'mb-0',
      small ? 'gap-1' : 'flex-wrap gap-2'
    ].filter(Boolean).join(' ');

    // Anterior
    ul.appendChild(createPageItem(
      page === 1 ? 1 : page - 1,
      '<',
      { disabled: page === 1, small },
      paginationQuery
    ));

    // Primera
    ul.appendChild(createPageItem(1, '1', { active: page === 1, small }, paginationQuery));

    // Elipsis después de primera
    if (page > 2) {
      ul.appendChild(createDots(small));
    }

    // Página actual intermedia
    if (page > 1 && page < pages) {
      ul.appendChild(createPageItem(page, String(page), { active: true, small }, paginationQuery));
    }

    // Elipsis antes de última
    if (page < pages - 1) {
      ul.appendChild(createDots(small));
    }

    // Última
    if (pages > 1) {
      ul.appendChild(createPageItem(pages, String(pages), { active: page === pages, small }, paginationQuery));
    }

    // Siguiente
    ul.appendChild(createPageItem(
      page === pages ? pages : page + 1,
      '>',
      { disabled: page === pages, small },
      paginationQuery
    ));

    return ul;
  };

  const build = ({ page, pages, total, paginationQuery, itemsLabel = 'registros', ariaLabel = 'Paginación' } = {}) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex flex-column-reverse flex-md-row justify-content-between align-items-md-center gap-2';

    const summary = document.createElement('small');
    summary.className = 'text-muted';
    summary.textContent = `Página ${page} de ${pages} | Total: ${total} ${itemsLabel}`;
    wrapper.appendChild(summary);

    // Desktop / tablet
    const navDesktop = document.createElement('nav');
    navDesktop.className = 'd-none d-md-block';
    navDesktop.setAttribute('aria-label', ariaLabel);
    navDesktop.appendChild(buildList({ page, pages, paginationQuery, small: false }));
    wrapper.appendChild(navDesktop);

    // Mobile
    const navMobile = document.createElement('nav');
    navMobile.className = 'd-md-none w-100';
    navMobile.setAttribute('aria-label', ariaLabel);
    navMobile.appendChild(buildList({ page, pages, paginationQuery, small: true }));
    wrapper.appendChild(navMobile);

    return wrapper;
  };

  const renderInto = (container, options) => {
    if (!container) return null;
    const node = build(options);
    container.innerHTML = '';
    container.appendChild(node);
    return node;
  };

  window.PaginationRenderer = {
    build,
    renderInto
  };
})();
