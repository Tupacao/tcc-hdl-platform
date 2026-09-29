import { Toaster } from 'sonner';
import { useTheme } from '@/hooks/use-theme';

/**
 * RNF09-I01 — o `sonner` tem paleta própria (light/dark), independente dos
 * tokens `--popover`/`--popover-foreground` do projeto, e o prop `theme`
 * default é `'light'` fixo (não reage à classe `.dark` nem a
 * `prefers-color-scheme`). Sem passar `resolvedTheme` explicitamente, o toast
 * renderizava sempre claro — inclusive por cima da interface escura,
 * descoberto ao vivo durante a auditoria de contraste. Precisa estar dentro
 * de `<ThemeProvider>` para ler `useTheme()`, então vive num componente à
 * parte em vez de `<Toaster>` direto em `App.tsx`.
 */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} position="bottom-right" closeButton />;
}
