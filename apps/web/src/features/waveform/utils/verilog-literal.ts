/**
 * Formata um valor de sinal para o painel "Leitura no cursor" (RF06-I03). O frame
 * 8.2 do Figma mostra o valor como literal Verilog dimensionado ("4'b1111"), não
 * hexadecimal — mesma decisão já tomada para o texto dentro do barramento
 * (RF06-I02): o design usa o binário literal por bit, que é o único jeito de um
 * valor parcialmente indefinido mostrar bits conhecidos e "x"/"z" juntos.
 */
export function toVerilogLiteral(value: string, width: number): string {
  if (width <= 1) return value;
  return `${width}'b${value}`;
}
