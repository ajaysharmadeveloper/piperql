'use client';

interface SqlResultProps {
  data: Record<string, unknown>[];
}

export default function SqlResult({ data }: SqlResultProps) {
  if (!data || data.length === 0) return null;
  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-secondary/50 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-bg-tertiary/80">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-2 sm:px-4 py-2.5 text-left text-xs uppercase tracking-wider text-text-muted font-semibold border-b border-border-primary whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-bg-hover/50 transition-colors">
              {columns.map((col) => (
                <td key={col} className="px-2 sm:px-4 py-2 text-text-secondary font-mono text-xs sm:text-[13px] border-b border-border-primary/50 max-w-[200px] truncate">
                  {row[col] === null ? <span className="text-text-muted italic">NULL</span> : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
