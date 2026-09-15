import type { ComponentType } from 'react';
import type { HdlSources } from '@tplab/shared';

/** Props recebidas por todo componente de conteudo em `content/` - mesmo contrato para todas as secoes. */
export interface DocSectionContentProps {
  /** RF07-I03: quem chama decide se avisa sobre alteracoes nao salvas antes de trocar as fontes do editor. */
  onOpenInEditor: (sources: HdlSources) => void;
}

/** Grupos do indice (Figma 7.1/7.3: "INICIO RAPIDO" / "REFERENCIA" / "AJUDA"). */
export type DocCategory = 'inicio-rapido' | 'referencia' | 'ajuda';

/** Uma entrada do indice/busca/navegacao da documentacao (RF11). */
export interface DocSection {
  id: string;
  category: DocCategory;
  title: string;
  summary: string;
  Component: ComponentType<DocSectionContentProps>;
}
