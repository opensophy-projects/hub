export interface ComponentConfig {
  id: string;
  name: string;
  description: string;
  files: Array<{
    name: string;
    path: string;
    language: string;
  }>;
  props: Array<PropConfig>;
}

export interface PropConfig {
  name: string;
  type: string;
  default: any;
  description: string;
  control: 'text' | 'number' | 'select' | 'checkbox' | 'color';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface LoadedComponent {
  config: ComponentConfig;
  Component: React.ComponentType<any>;
  fileContents: Record<string, string>;
}
