/**
 * Generates a unique readable order number format, e.g., NF-20260831-ABCD
 */
export const generateOrderNumber = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestampShort = Date.now().toString().slice(-3);
  return `NF-${dateStr}-${randomHex}${timestampShort}`;
};
