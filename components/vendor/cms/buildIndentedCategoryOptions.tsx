import type { CatOption } from "@/utils/Types";

/** Builds an indented flat list for category selects */
export function buildIndentedCategoryOptions(cats: CatOption[]) {
  const safeCats = Array.isArray(cats) ? cats : [];
  const byParent = new Map<string | null, CatOption[]>();
  safeCats.forEach((c) => {
    const key = c.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  });
  const options: { value: string; label: string }[] = [];
  const visited = new Set<string>();
  const walk = (parentId: string | null, depth: number) => {
    (byParent.get(parentId) ?? []).forEach((c) => {
      if (visited.has(c.id)) return;
      visited.add(c.id);
      options.push({
        value: c.id,
        label: `${"—".repeat(depth)}${depth ? " " : ""}${c.name}`,
      });
      walk(c.id, depth + 1);
      visited.delete(c.id);
    });
  };
  walk(null, 0);
  return options;
}
