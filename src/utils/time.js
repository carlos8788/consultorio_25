const DURATION_MULTIPLIERS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
};

export const parseDurationToMs = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value * 1000;
  }

  const text = String(value).trim();
  const match = text.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multiplier = DURATION_MULTIPLIERS[unit];
  return multiplier ? amount * multiplier : null;
};
