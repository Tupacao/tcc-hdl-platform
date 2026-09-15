import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { WaveSignal } from '../models/types';
import { getSignalKey } from '../utils/rows';
import { formatBitWidthLabel, formatSignalCountLabel, SIGNAL } from '../utils/messages';

interface SignalListProps {
  rows: WaveSignal[];
  selectedKeys: Set<string>;
  onChange: (next: Set<string>) => void;
}

/**
 * Chip "Sinais X de Y" + seletor com busca (RF06-I03, frames 5.1 e 8.2 do Figma).
 * Popover próprio (sem Radix) — a lista é só busca + checkbox + dois botões, não
 * precisa do aparato de posicionamento/portal de um Popover completo.
 */
export function SignalList({ rows, selectedKeys, onChange }: SignalListProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        // Padrão WAI-ARIA de disclosure: fechar sem devolver o foco ao gatilho
        // deixa o foco cair para o <body>, um beco sem saída para quem navega só por teclado.
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const filteredRows = useMemo(
    () => rows.filter((row) => row.name.toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  );

  function toggle(key: string) {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent active:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {formatSignalCountLabel(selectedKeys.size, rows.length)}
      </button>

      {open && (
        <div
          role="group"
          aria-label={SIGNAL.LIST_ARIA_LABEL}
          className="absolute right-0 top-full z-10 mt-1 w-64 rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
        >
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={SIGNAL.SEARCH_PLACEHOLDER}
            className="mb-2 h-8 text-xs"
          />
          <div className="mb-1 flex gap-1">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => onChange(new Set(rows.map(getSignalKey)))}
            >
              {SIGNAL.SELECT_ALL_LABEL}
            </Button>
            <span aria-hidden className="text-xs text-muted-foreground">
              ·
            </span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => onChange(new Set())}
            >
              {SIGNAL.CLEAR_LABEL}
            </Button>
          </div>
          <ul className="max-h-64 overflow-auto">
            {filteredRows.length === 0 && (
              <li className="px-1 py-2 text-xs text-muted-foreground">
                {SIGNAL.LIST_EMPTY_MESSAGE}
              </li>
            )}
            {filteredRows.map((row) => {
              const key = getSignalKey(row);
              const inputId = `waveform-signal-${key}`;
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 rounded px-1 py-1.5 hover:bg-accent"
                >
                  <Checkbox
                    id={inputId}
                    checked={selectedKeys.has(key)}
                    onCheckedChange={() => toggle(key)}
                  />
                  <label
                    htmlFor={inputId}
                    className="flex flex-1 items-center justify-between gap-2 text-xs"
                  >
                    <span className="truncate">{row.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatBitWidthLabel(row.width)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
