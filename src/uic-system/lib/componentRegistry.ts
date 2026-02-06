interface ComponentRegistry {
  id: string;
  name: string;
  Component: React.ComponentType<any>;
  files: Record<string, string>;
  config: any;
  defaultProps?: Record<string, any>;
}

const registry = new Map<string, ComponentRegistry>();

export const registerComponent = (component: ComponentRegistry) => {
  registry.set(component.id, component);
};

export const getComponent = (id: string) => {
  return registry.get(id);
};

export const getAllComponents = () => {
  return Array.from(registry.values());
};
