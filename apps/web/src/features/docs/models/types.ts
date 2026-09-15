import type { ComponentType } from 'react';
import type { HdlSources } from '@tplab/shared';

/** Props recebidas por todo componente de conteudo em `content/` - mesmo contrato para todas as secoes. */
export interface DocSectionContentProps {
  /** RF07-I03: quem chama decide se avisa sobre alteracoes nao salvas antes de trocar as fontes do editor. */
  onOpenInEditor: (sources: HdlSources) => void;
}

/** Uma entrada do indice/busca da documentacao (RF11). `id` vira o hash de navegacao interna do painel. */
export interface DocSection {
  id: string;
  title: string;
  summary: string;
  Component: ComponentType<DocSectionContentProps>;
}
