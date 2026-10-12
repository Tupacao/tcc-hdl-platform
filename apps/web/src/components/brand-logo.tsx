import marcaUrl from '@/assets/Marca.png';

const BRAND_NAME = 'TP Lab';

/**
 * Marca do TP Lab usada nos cabeçalhos (workspace, projetos e documentação): o
 * símbolo e o nome andam juntos, então ficam num componente só — trocar a marca
 * passa a ser uma edição, não três.
 *
 * O símbolo é decorativo (`alt=""`): quem usa leitor de tela ouve o nome pelo
 * `h1` ao lado, e anunciar os dois repetiria a mesma informação.
 */
export function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <img src={marcaUrl} alt="" width={34} height={34} className="size-5 shrink-0" />
      <h1 className="text-sm font-semibold">{BRAND_NAME}</h1>
    </div>
  );
}
