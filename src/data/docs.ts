export interface Doc {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: 'docs' | 'blog' | 'news';
  category?: string;
  content?: string;
  bannercolor?: string;
  bannertext?: string;
  author?: string;
  date?: string;
  tags?: string[];
  keywords?: string;
  canonical?: string;
  robots?: string;
  lang?: string;
}


export const docs: Doc[] = [];
