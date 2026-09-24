import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import type { Theme } from '@/components/theme-provider';

const GROUP_LABEL = 'Tema';

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
];

/** Controle segmentado com os três modos de tema, sempre visíveis (RF10). */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <RadioGroupPrimitive.Root
      aria-label={GROUP_LABEL}
      value={theme}
      onValueChange={(value) => setTheme(value as Theme)}
      orientation="horizontal"
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted p-0.5"
    >
      {OPTIONS.map(({ value, label }) => (
        <RadioGroupPrimitive.Item
          key={value}
          value={value}
          className={cn(
            'cursor-pointer rounded-sm px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none',
            'hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
            'data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-xs',
          )}
        >
          {label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
