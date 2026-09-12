/**
 * Formata um valor de sinal para o painel "Leitura no cursor" (RF06-I03). O frame
 * 8.2 do Figma mostra o valor como literal Verilog dimensionado ("4'b1111"), nao
 * hexadecimal — mesma decisao ja tomada para o texto dentro do barramento
 * (RF06-I02): o design usa o binario literal por bit, que e o unico jeito de um
 * valor parcialmente indefinido mostrar bits conhecidos e "x"/"z" juntos.
 */
export function toVerilogLiteral(value: string, width: number): string {
  if (width <= 1) return value;
  return `${width}'b${value}`;
}
