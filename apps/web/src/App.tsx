import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { Workspace } from '@/features/workspace/workspace';

export default function App() {
  return (
    <ThemeProvider>
      <Workspace />
      <Toaster position="bottom-right" closeButton />
    </ThemeProvider>
  );
}
