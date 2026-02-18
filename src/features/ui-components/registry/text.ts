import type { ComponentConfig } from '../types';
import blurTextConfig from '../blur-text/config.json';

const textLoaders = {
  'blur-text': () => import('../blur-text'),
} as const;

const textConfigs: Record<string, ComponentConfig> = {
  'blur-text': blurTextConfig as ComponentConfig,
};

export const textRegistry = {
  loaders: textLoaders,
  configs: textConfigs,
};

export type TextComponentId = keyof typeof textLoaders;
