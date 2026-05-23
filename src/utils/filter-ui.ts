// Shared tag / category filter wiring for listing pages.
// Used by /talks-and-media/ and /publications/ — both render a row of
// pill buttons that show/hide items by their `data-tag`, collapse year
// sections that end up empty, and sync the choice to a URL query param.
//
// The `match` hook lets callers extend the default tag-equality test
// (e.g. the talks page adds a virtual "upcoming" filter that reads
// `data-upcoming` instead of `data-tag`). "all" is a reserved sentinel
// meaning "show everything."

export interface FilterUIOptions {
  filterRootSelector: string;     // wraps the .filter-btn buttons
  itemSelector: string;           // matches every filterable item
  paramName: string;              // URL query param to sync the selection to
  defaultFilter: string;          // filter applied when URL has no param
  sectionSelector?: string;       // year sections to collapse when empty
  match?: (item: HTMLElement, filter: string) => boolean;
}

function defaultMatch(item: HTMLElement, filter: string): boolean {
  if (filter === 'all') return true;
  return (item.dataset.tag ?? '') === filter;
}

export function setupFilterUI(opts: FilterUIOptions): void {
  const {
    filterRootSelector,
    itemSelector,
    paramName,
    defaultFilter,
    sectionSelector = 'section[data-year-section]',
    match = defaultMatch,
  } = opts;

  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(`${filterRootSelector} .filter-btn`),
  );
  const items = Array.from(document.querySelectorAll<HTMLElement>(itemSelector));
  const sections = Array.from(document.querySelectorAll<HTMLElement>(sectionSelector));

  function applyFilter(filter: string): void {
    for (const item of items) {
      item.style.display = match(item, filter) ? '' : 'none';
    }
    for (const section of sections) {
      const visible = section.querySelectorAll(
        `${itemSelector}:not([style*="display: none"])`,
      ).length;
      section.style.display = visible === 0 ? 'none' : '';
      const counter = section.querySelector('[data-year-count]');
      if (counter) counter.textContent = `${visible}件`;
    }
    for (const btn of buttons) {
      btn.classList.toggle('is-active', btn.dataset.filter === filter);
    }
    const url = new URL(window.location.href);
    if (filter === defaultFilter) url.searchParams.delete(paramName);
    else url.searchParams.set(paramName, filter);
    history.replaceState(null, '', url.toString());
  }

  for (const btn of buttons) {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter ?? defaultFilter));
  }

  const initial = new URL(window.location.href).searchParams.get(paramName) ?? defaultFilter;
  const target = buttons.some((b) => b.dataset.filter === initial) ? initial : defaultFilter;
  applyFilter(target);
}
