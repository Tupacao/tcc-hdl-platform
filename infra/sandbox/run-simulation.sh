#!/bin/sh
# Compila e simula os arquivos HDL montados em /work.
# Codigos de saida — contrato de todo script de sandbox, consumido por
# apps/api/src/modules/simulation/sandbox.ts (`mapFailure`):
#   0   sucesso
#   2   erro de compilacao (iverilog)
#   3   erro em tempo de execucao (vvp)
#   4   timeout da compilacao (iverilog passou de SIM_COMPILE_TIMEOUT_S)
#   124 timeout da simulacao (vvp passou de SIM_TIMEOUT_S)
#   137 processo morto por SIGKILL antes do limite de tempo — quase sempre o OOM
#       killer; quem decide se foi memoria e o `State.OOMKilled` do Docker, nao
#       este script (ele so nao pode rotular como timeout algo que nao foi).
set -u

BIN=/tmp/simulation.vvp
TIMEOUT_S="${SIM_TIMEOUT_S:-10}"
COMPILE_TIMEOUT_S="${SIM_COMPILE_TIMEOUT_S:-5}"

# Glob sem match expande para o proprio padrao no /bin/sh: filtra os inexistentes.
FILES=""
for file in /work/*.v /work/*.sv; do
    [ -f "$file" ] && FILES="$FILES $file"
done

if [ -z "$FILES" ]; then
    echo "Nenhum arquivo .v ou .sv encontrado em /work" >&2
    exit 2
fi

# `timeout -s KILL` devolve 137 tanto quando o limite estoura quanto quando outro
# SIGKILL (OOM) mata o processo antes. O tempo decorrido separa os dois casos.
# Resolucao de 1 s: um OOM a menos de 1 s do limite pode ser lido como timeout —
# o `OOMKilled` do Docker, consultado pelo host, e quem corrige esse caso.
elapsed_since() {
    echo $(($(date +%s) - $1))
}

# Sem -s: o iverilog elege como topo o modulo que ninguem instancia (o testbench).
# shellcheck disable=SC2086
compile_started=$(date +%s)
timeout -s KILL "$COMPILE_TIMEOUT_S" iverilog -g2012 -o "$BIN" $FILES
status=$?
if [ "$status" -ne 0 ]; then
    if [ "$status" -eq 137 ]; then
        [ "$(elapsed_since "$compile_started")" -ge "$COMPILE_TIMEOUT_S" ] && exit 4
        exit 137
    fi
    exit 2
fi

sim_started=$(date +%s)
timeout -s KILL "$TIMEOUT_S" vvp "$BIN"
status=$?
if [ "$status" -eq 137 ]; then
    [ "$(elapsed_since "$sim_started")" -ge "$TIMEOUT_S" ] && exit 124
    exit 137
fi
[ "$status" -ne 0 ] && exit 3
exit 0
