import type { ComponentType } from 'react';

export interface CustomPageMetadata {
  title: string;
  description?: string;
  image?: string;
  author?: string;
  date?: string;
  keywords?: string;
  robots?: string;
  lang?: string;
  type?: 'website' | 'article';
}

export interface CustomPageDefinition {
  slug: string;
  folderName: string;
  component: ComponentType;
  metadata: CustomPageMetadata;
}

export interface CustomPageModule {
  default: ComponentType;
}

export interface CustomPageMetadataModule {
  default: CustomPageMetadata;
}
