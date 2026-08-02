/** Format piasters as an EGP currency string (pure — safe for client components). */
export function fmtEgp(piasters: number): string {
  return `${(piasters / 100).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`
}
