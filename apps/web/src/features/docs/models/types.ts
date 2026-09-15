import type { ComponentType } from 'react';
import type { HdlSources } from '@tplab/shared';

/** Props recebidas por todo componente de conteúdo em `content/` - mesmo contrato para todas as seções. */
export interface DocSectionContentProps {
  /** RF07-I03: quem chama decide se avisa sobre alterações não salvas antes de trocar as fontes do editor. */
  onOpenInEditor: (sources: HdlSources) => void;
}

/** Grupos do índice (Figma 7.1/7.3: "INÍCIO RÁPIDO" / "REFERÊNCIA" / "AJUDA"). */
export type DocCategory = 'inicio-rapido' | 'referencia' | 'ajuda';

/** Uma entrada do índice/busca/navegação da documentação (RF11). */
export interface DocSection {
  id: string;
  category: DocCategory;
  title: string;
  summary: string;
  Component: ComponentType<DocSectionContentProps>;
}
