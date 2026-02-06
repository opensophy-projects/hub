interface ComponentConfig {
  id: string;
  name: string;
  description: string;
  files: Array<{
    name: string;
    path: string;
    language: string;
  }>;
  props: Array<{
    name: string;
    type: string;
    default: any;
    description: string;
    control: string;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
  }>;
}

interface LoadedComponent {
  config: ComponentConfig;
  Component: React.ComponentType<any>;
  fileContents: Record<string, string>;
}

const componentCache = new Map<string, LoadedComponent>();

export async function loadComponent(componentId: string): Promise<LoadedComponent | null> {
  if (componentCache.has(componentId)) {
    return componentCache.get(componentId)!;
  }

  try {
    const configModule = await import(`./${componentId}/config.json`);
    const config: ComponentConfig = configModule.default;

    const componentModule = await import(`./${componentId}/index.ts`);
    const Component = componentModule[Object.keys(componentModule).find(key => 
      key.toLowerCase().includes(componentId.split('-').join(''))
    ) || 'default'];

    const fileContents: Record<string, string> = {};
    for (const file of config.files) {
      try {
        const response = await fetch(`/src/uic-system/${componentId}/${file.name}`);
        if (response.ok) {
          fileContents[file.name] = await response.text();
        }
      } catch (error) {
        console.warn(`Failed to load file ${file.name}:`, error);
      }
    }

    const loaded: LoadedComponent = {
      config,
      Component,
      fileContents,
    };

    componentCache.set(componentId, loaded);
    return loaded;
  } catch (error) {
    console.error(`Failed to load component ${componentId}:`, error);
    return null;
  }
}

export function getDefaultProps(config: ComponentConfig): Record<string, any> {
  const props: Record<string, any> = {};
  config.props.forEach(prop => {
    props[prop.name] = prop.default;
  });
  return props;
}
