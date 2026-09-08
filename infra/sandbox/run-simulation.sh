#!/bin/sh
# Compila e simula os arquivos HDL montados em /work.
# Codigos de saida consumidos por apps/api/src/modules/simulation/sandbox.ts:
#   0   sucesso
#   2   erro de compilacao (iverilog)
#   3   erro em tempo de execucao (vvp)
#   124 timeout
set -u

BIN=/tmp/simulation.vvp
TIMEOUT_S="${SIM_TIMEOUT_S:-10}"

# Glob sem match expande para o proprio padrao no /bin/sh: filtra os inexistentes.
FILES=""
for file in /work/*.v /work/*.sv; do
    [ -f "$file" ] && FILES="$FILES $file"
done

if [ -z "$FILES" ]; then
    echo "Nenhum arquivo .v ou .sv encontrado em /work" >&2
    exit 2
fi

# Sem -s: o iverilog elege como topo o modulo que ninguem instancia (o testbench).
# shellcheck disable=SC2086
iverilog -g2012 -o "$BIN" $FILES || exit 2

timeout -s KILL "$TIMEOUT_S" vvp "$BIN"
status=$?

[ "$status" -eq 137 ] && exit 124
[ "$status" -ne 0 ] && exit 3
exit 0
