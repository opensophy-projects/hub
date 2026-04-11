const HEADER_OFFSET = 80;

export function scrollToElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const top = element.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;

  window.scrollTo({
    top,
    behavior: 'smooth',
  });
}

export function getHeaderOffset(): number {
  return HEADER_OFFSET;
}