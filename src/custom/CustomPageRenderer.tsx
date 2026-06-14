import { getCustomPageBySlug } from './index';

interface CustomPageRendererProps {
  readonly slug: string;
}

export default function CustomPageRenderer({ slug }: CustomPageRendererProps) {
  const page = getCustomPageBySlug(slug);
  if (!page) return null;

  const PageComponent = page.component;
  return <PageComponent />;
}