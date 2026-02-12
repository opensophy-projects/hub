import type { ComponentConfig } from '../types';

const cardLoaders = {
} as const;

const cardConfigs: Record<string, ComponentConfig> = {
};

export const cardRegistry = {
  loaders: cardLoaders,
  configs: cardConfigs,
};

export type CardComponentId = keyof typeof cardLoaders;