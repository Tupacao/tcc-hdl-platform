import { useContext } from 'react';
import { ThemeContext } from '@/components/theme-provider';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return context;
}
