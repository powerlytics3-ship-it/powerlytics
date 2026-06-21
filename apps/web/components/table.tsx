export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey
}: {
  columns: Array<{ key: keyof T | string; header: string; render?: (row: T) => React.ReactNode }>;
  rows: T[];
  rowKey: (row: T) => string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-normal text-zinc-500">
          <tr>
            {columns.map((column) => <th key={String(column.key)} className="px-3 py-2">{column.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-zinc-200">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-3 py-3 text-zinc-700">
                  {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
