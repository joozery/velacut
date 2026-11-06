const coinFormatter = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const intFormatter = new Intl.NumberFormat("th-TH");
const bahtFormatter = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCoins = (n: number) => coinFormatter.format(n);
/** ยอดเงิน/คอยน์แบบทศนิยม 2 ตำแหน่งเสมอ เช่น 0.00, 2.10 */
export const formatCoinsFixed = (n: number) => bahtFormatter.format(n);
export const formatInt = (n: number) => intFormatter.format(n);
export const formatBaht = (n: number) => bahtFormatter.format(n);
