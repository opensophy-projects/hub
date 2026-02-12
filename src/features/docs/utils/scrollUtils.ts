const HEADER_OFFSET = 80;

export function scrollToElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - HEADER_OFFSET;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

export function getHeaderOffset(): number {
  return HEADER_OFFSET;
}
