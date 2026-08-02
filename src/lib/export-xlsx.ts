import * as XLSX from 'xlsx'

/** Convert an array of flat objects into an .xlsx Buffer (UTF-8, Arabic-safe). */
export function rowsToXlsx(sheetName: string, rows: Record<string, unknown>[]): Buffer {
  const sheet = XLSX.utils.json_to_sheet(rows)
  // widen columns a bit for readability
  const widths = Object.keys(rows[0] ?? {}).map((k) => {
    const max = rows.reduce((n, r) => Math.max(n, String(r[k] ?? '').length), 10)
    return { wch: Math.min(Math.max(max + 2, 12), 60) }
  })
  sheet['!cols'] = widths
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, sheetName.slice(0, 31))
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

/** Convert a single row key map → keep only given keys in order, else keep all. */
export function pick(row: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of keys) out[k] = row[k]
  return out
}
