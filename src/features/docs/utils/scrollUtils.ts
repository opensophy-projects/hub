const DEFAULT_HEADER_OFFSET = 88;

function resolveHeaderOffset(): number {
  if (typeof window === 'undefined') return DEFAULT_HEADER_OFFSET;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--toc-scroll-offset').trim();
  const parsed = Number.parseInt(raw, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return DEFAULT_HEADER_OFFSET;
}

export function scrollToElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const headerOffset = resolveHeaderOffset();
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.scrollY - headerOffset;

  window.scrollTo({
    top,
    behavior: 'smooth',
  });
}

export function getHeaderOffset(): number {
  return resolveHeaderOffset();
}
