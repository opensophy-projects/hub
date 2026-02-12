import type { ComponentConfig } from '../types';

const buttonLoaders = {
} as const;

const buttonConfigs: Record<string, ComponentConfig> = {
};

export const buttonRegistry = {
  loaders: buttonLoaders,
  configs: buttonConfigs,
};

export type ButtonComponentId = keyof typeof buttonLoaders;
