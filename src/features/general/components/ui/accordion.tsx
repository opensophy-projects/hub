import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

type AccordionType = 'single' | 'multiple';

interface AccordionContextValue {
  type: AccordionType;
  value: string[];
  toggle: (itemValue: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

type AccordionProps = React.HTMLAttributes<HTMLDivElement> & {
  type?: AccordionType;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
};

const Accordion: React.FC<AccordionProps> = ({ type = 'single', value, defaultValue, onValueChange, collapsible = true, children, ...props }) => {
  const initial = React.useMemo(() => {
    if (value !== undefined) return Array.isArray(value) ? value : value ? [value] : [];
    if (defaultValue !== undefined) return Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [];
    return [];
  }, [value, defaultValue]);

  const [internalValue, setInternalValue] = React.useState<string[]>(initial);
  const current = React.useMemo(
    () => (value !== undefined ? (Array.isArray(value) ? value : value ? [value] : []) : internalValue),
    [internalValue, value]
  );

  const toggle = React.useCallback((itemValue: string) => {
    let next: string[] = [];
    if (type === 'multiple') {
      next = current.includes(itemValue) ? current.filter((v) => v !== itemValue) : [...current, itemValue];
    } else {
      const isOpen = current.includes(itemValue);
      next = isOpen ? (collapsible ? [] : current) : [itemValue];
    }

    if (value === undefined) setInternalValue(next);
    onValueChange?.(type === 'single' ? (next[0] ?? '') : next);
  }, [collapsible, current, onValueChange, type, value]);

  return (
    <AccordionContext.Provider value={{ type, value: current, toggle }}>
      <div {...props}>{children}</div>
    </AccordionContext.Provider>
  );
};

const AccordionItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />
);
AccordionItem.displayName = 'AccordionItem';

const AccordionItemContext = React.createContext<{ value: string } | null>(null);

const WrappedAccordionItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ value, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={{ value }}>
      <AccordionItem ref={ref} value={value} {...props}>{children}</AccordionItem>
    </AccordionItemContext.Provider>
  )
);
WrappedAccordionItem.displayName = 'WrappedAccordionItem';

const AccordionTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(AccordionContext);
    const item = React.useContext(AccordionItemContext);
    if (!ctx || !item) return null;
    const open = ctx.value.includes(item.value);

    return (
      <div className="flex">
        <button
          ref={ref}
          type="button"
          aria-expanded={open}
          onClick={() => ctx.toggle(item.value)}
          className={cn(
            "flex flex-1 items-center justify-between p-6 text-left font-semibold transition-all hover:opacity-70",
            className,
          )}
          {...props}
        >
          {children}
          <ChevronDownIcon className={cn("shrink-0 opacity-60 transition-transform duration-200 ml-4", open && "rotate-180")} size={24} aria-hidden="true" />
        </button>
      </div>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(AccordionContext);
  const item = React.useContext(AccordionItemContext);
  if (!ctx || !item) return null;
  const open = ctx.value.includes(item.value);

  return (
    <div ref={ref} className={cn("overflow-hidden text-sm", open ? "block" : "hidden")} {...props}>
      <div className={cn("px-6 pb-6 pt-0", className)}>{children}</div>
    </div>
  );
});
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionContent, WrappedAccordionItem as AccordionItem, AccordionTrigger };
