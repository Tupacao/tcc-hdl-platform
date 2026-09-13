import { ModuleNameSchema } from '@tplab/shared';
import { PROJECT_NAME_ERRORS } from './messages';

export const PROJECT_NAME_MAX_LENGTH = 120;

/**
 * O nome do projeto vira o nome do arquivo `.v` e do modulo principal (dialogo
 * "Novo projeto" do Figma) - por isso segue a mesma regra de identificador de
 * `ModuleNameSchema`, mais estrita que o `CreateProjectSchema.name` generico de
 * `packages/shared` (que so limita tamanho, sem exigir formato de identificador).
 */
export function validateProjectName(name: string, existingNames: string[]): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return PROJECT_NAME_ERRORS.REQUIRED;
  if (trimmed.length > PROJECT_NAME_MAX_LENGTH) return PROJECT_NAME_ERRORS.TOO_LONG;
  if (!ModuleNameSchema.safeParse(trimmed).success) return PROJECT_NAME_ERRORS.INVALID_CHARACTERS;

  const isDuplicate = existingNames.some(
    (existing) => existing.toLowerCase() === trimmed.toLowerCase(),
  );
  if (isDuplicate) return PROJECT_NAME_ERRORS.DUPLICATE;

  return null;
}
