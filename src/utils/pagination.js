export const buildPaginationDisplay = (currentPage = 1, totalPages = 1, maxNumbers = 10) => {
  const result = [];

  if (!totalPages || totalPages < 1) {
    return result;
  }

  const current = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);

  if (totalPages <= maxNumbers) {
    for (let page = 1; page <= totalPages; page++) {
      result.push({ type: 'page', number: page });
    }
    return result;
  }

  const innerCount = Math.max(maxNumbers - 2, 1);
  let start = Math.max(2, current - Math.floor(innerCount / 2));
  let end = Math.min(totalPages - 1, start + innerCount - 1);

  const actualCount = end - start + 1;
  if (actualCount < innerCount) {
    start = Math.max(2, end - innerCount + 1);
  }

  const pages = [1];
  for (let page = start; page <= end; page++) {
    pages.push(page);
  }
  pages.push(totalPages);

  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];

    if (index > 0) {
      const previousPage = pages[index - 1];
      if (page - previousPage > 1) {
        result.push({ type: 'ellipsis' });
      }
    }

    result.push({ type: 'page', number: page });
  }

  return result;
};

export const buildPaginationQuery = (query = {}, excludedKeys = ['page']) => {
  const params = new URLSearchParams();
  const excluded = new Set(excludedKeys);

  Object.entries(query).forEach(([key, value]) => {
    if (excluded.has(key)) {
      return;
    }

    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value
        .filter((item) => item !== undefined && item !== null && item !== '')
        .forEach((item) => params.append(key, item));
      return;
    }

    params.append(key, value);
  });

  return params.toString();
};

export const buildPaginationData = (
  paginatedResult,
  query = {},
  excludedKeys = ['page'],
  maxNumbers = 10
) => {
  if (!paginatedResult) {
    return {
      pagination: null,
      paginationDisplay: [],
      paginationQuery: ''
    };
  }

  return {
    pagination: {
      page: paginatedResult.page,
      pages: paginatedResult.totalPages,
      total: paginatedResult.totalDocs,
      limit: paginatedResult.limit
    },
    paginationDisplay: buildPaginationDisplay(
      paginatedResult.page,
      paginatedResult.totalPages,
      maxNumbers
    ),
    paginationQuery: buildPaginationQuery(query, excludedKeys)
  };
};
