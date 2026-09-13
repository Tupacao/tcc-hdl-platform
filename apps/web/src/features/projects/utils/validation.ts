import { ModuleNameSchema } from '@tplab/shared';
import { PROJECT_NAME_ERRORS } from './messages';

/**
 * 35, nao os 120 de `CreateProjectSchema.name` de `packages/shared` (que e um
 * rotulo generico, sem virar nome de arquivo) - o nome aqui aparece inteiro no
 * dialogo de renomear e no titulo do de excluir, e um nome perto do limite
 * antigo vazava do `<Input>` e quebrava o layout dos dois.
 */
export const PROJECT_NAME_MAX_LENGTH = 35;

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

const COPY_SUFFIX = '_copia';

/**
 * Nome do "Duplicar" do menu de acoes: `${nome}_copia`, ou `_copia2`/`_copia3`/...
 * se ja existir. Trunca a base para que o resultado nunca passe de
 * `PROJECT_NAME_MAX_LENGTH` - sem isso, duplicar um projeto com nome perto do
 * limite gerava um nome mais longo que o proprio limite permite.
 */
export function buildCopyName(baseName: string, existingNames: string[]): string {
  const existing = new Set(existingNames.map((name) => name.toLowerCase()));

  let counter = 1;
  let candidate: string;
  do {
    const suffix = counter === 1 ? COPY_SUFFIX : `${COPY_SUFFIX}${counter}`;
    const maxBaseLength = Math.max(1, PROJECT_NAME_MAX_LENGTH - suffix.length);
    candidate = `${baseName.slice(0, maxBaseLength)}${suffix}`;
    counter += 1;
  } while (existing.has(candidate.toLowerCase()));

  return candidate;
}
