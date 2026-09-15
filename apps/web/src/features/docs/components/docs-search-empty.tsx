import { Button } from '@/components/ui/button';
import { findOutOfScopeMatch } from '../utils/out-of-scope-terms';
import { formatNoSearchResultsMessage, formatOutOfScopeMessage, SEARCH_EMPTY } from '../utils/messages';

interface DocsSearchEmptyProps {
  query: string;
  onSearchTerm: (term: string) => void;
  onNavigateToSection: (id: string) => void;
  /** Id da secao "O que o TP Lab nao faz" - omitido enquanto ela nao existir no indice. */
  outOfScopeSectionId?: string;
}

/**
 * Estado vazio da busca (RF11-I01, Figma 7.6 "Busca sem resultado"). Boa
 * parte do que o estudante procura e nao acha nao e falha do indice: e
 * SystemVerilog/VHDL/sintese, fora de proposito do MVP. Um "nenhum
 * resultado" generico faria a documentacao parecer incompleta - quando o
 * termo bate com algo conhecidamente fora de escopo, aponta o equivalente
 * em Verilog em vez de so dizer "nao encontrado".
 */
export function DocsSearchEmpty({
  query,
  onSearchTerm,
  onNavigateToSection,
  outOfScopeSectionId,
}: DocsSearchEmptyProps) {
  const match = findOutOfScopeMatch(query);

  return (
    <div className="flex flex-col gap-2 px-2 py-1 text-xs">
      <p className="text-muted-foreground">{formatNoSearchResultsMessage(query)}</p>
      {match && (
        <>
          <p className="text-muted-foreground">{formatOutOfScopeMessage(match.verilogEquivalent)}</p>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="secondary"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onSearchTerm(match.verilogEquivalent)}
            >
              {match.verilogEquivalent}
            </Button>
            {outOfScopeSectionId && (
              <Button
                variant="secondary"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onNavigateToSection(outOfScopeSectionId)}
              >
                {SEARCH_EMPTY.NOT_IMPLEMENTED_LINK}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
