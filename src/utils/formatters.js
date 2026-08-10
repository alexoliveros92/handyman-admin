// src/utils/formatters.js
// Shared formatting helpers for the admin dashboard.

/**
 * Format a price as Guatemalan Quetzales: "Q 45.00"
 * Example: formatPrice(45) → "Q 45.00"
 */
export const formatPrice = (amount) => `Q ${Number(amount).toFixed(2)}`;

// Category -> pricing model, mirrored from handyman-mobile's
// src/constants/categories.js (the source of truth for category_id values
// actually stored on the handymen table). Determines whether a handyman
// has an hourly rate at all — plumbing/electrical are fixed-price,
// construction/smithy are quote-based, gardening is hourly.
const CATEGORY_PRICING_MODEL = {
  plumbing:     'fixed',
  electrical:   'fixed',
  construction: 'quote',
  smithy:       'quote',
  gardening:    'hourly',
};

/**
 * Human-readable rate label for a handyman.
 * hourly_rate is null for fixed-price/quote categories (the DB constraint
 * allows it to be null, or a positive number, never NaN) — this returns
 * the pricing model's label instead of trying to format a missing rate.
 *
 * Example: formatHandymanRate(150, 'gardening') → "Q 150.00/hr"
 * Example: formatHandymanRate(null, 'plumbing') → "Fixed price"
 * Example: formatHandymanRate(null, 'construction') → "Quote-based"
 */
export const formatHandymanRate = (hourlyRate, categoryId) => {
  if (hourlyRate != null) return `${formatPrice(hourlyRate)}/hr`;
  return CATEGORY_PRICING_MODEL[categoryId] === 'quote' ? 'Quote-based' : 'Fixed price';
};
