export const parseCookies = (req) => {
  const header = req?.headers?.cookie;
  if (!header) return {};

  return header.split(';').reduce((acc, part) => {
    const trimmed = part.trim();
    if (!trimmed) return acc;
    const index = trimmed.indexOf('=');
    if (index < 0) return acc;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1);
    if (!key) return acc;
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
};
