import { Button } from '@/components/ui/button';
import { findOutOfScopeMatch } from '../utils/out-of-scope-terms';
import { formatNoSearchResultsMessage, formatOutOfScopeMessage, SEARCH_EMPTY } from '../utils/messages';

interface DocsSearchEmptyProps {
  query: string;
  onSearchTerm: (term: string) => void;
  onNavigateToSection: (id: string) => void;
  /** Id da seção "O que o TP Lab não faz" - omitido enquanto ela não existir no índice. */
  outOfScopeSectionId?: string;
}

/**
 * Estado vazio da busca (RF11-I01, Figma 7.6 "Busca sem resultado"). Boa
 * parte do que o estudante procura e não acha não é falha do índice: é
 * SystemVerilog/VHDL/síntese, fora de propósito do MVP. Um "nenhum
 * resultado" genérico faria a documentação parecer incompleta - quando o
 * termo bate com algo conhecidamente fora de escopo, aponta o equivalente
 * em Verilog em vez de só dizer "não encontrado".
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
