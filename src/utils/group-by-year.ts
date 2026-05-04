export type GroupedByYear<T> = {
  grouped: Map<string, T[]>;
  orderedKeys: string[];
};

const ARCHIVE_THRESHOLD = 2023;

export function groupByYear<T>(
  items: T[],
  getDate: (item: T) => Date | undefined,
): GroupedByYear<T> {
  const grouped = new Map<string, T[]>();
  for (const it of items) {
    const y = getDate(it)?.getFullYear();
    const key = y && y >= ARCHIVE_THRESHOLD ? String(y) : 'archive';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(it);
  }

  const orderedKeys = Array.from(grouped.keys()).sort((a, b) => {
    if (a === 'archive') return 1;
    if (b === 'archive') return -1;
    return Number(b) - Number(a);
  });

  return { grouped, orderedKeys };
}
