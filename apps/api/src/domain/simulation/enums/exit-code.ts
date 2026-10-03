/**
 * Codigos de saida definidos por `infra/sandbox/run-simulation.sh` — contrato de
 * todo script de sandbox (ver `infra/sandbox/README.md`). Ficam em `domain/`
 * porque tanto a infraestrutura (que le o codigo do container) quanto a regra de
 * negocio (que o traduz em mensagem para o usuario, em
 * `application/simulation/service/limits.ts`) dependem deles. Mudar um valor aqui
 * exige mudar o script, e vice-versa.
 */
export const EXIT_COMPILE_ERROR = 2;
export const EXIT_RUNTIME_ERROR = 3;
export const EXIT_COMPILE_TIMEOUT = 4;
export const EXIT_TIMEOUT = 124;
/** 128 + SIGXFSZ: um arquivo gravado pelo testbench passou do teto por arquivo (RNF04-I03). */
export const EXIT_FILE_SIZE_LIMIT = 153;
export const EXIT_KILLED = 137;
