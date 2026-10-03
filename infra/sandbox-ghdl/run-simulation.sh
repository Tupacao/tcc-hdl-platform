#!/bin/sh
# Analisa, elabora e simula os arquivos VHDL montados em /work com o GHDL.
# Codigos de saida: a convencao de infra/sandbox/README.md (a mesma do sandbox Verilog).
#   0 sucesso | 2 erro de analise/elaboracao | 3 erro de execucao | 4 timeout da analise
#   124 timeout da simulacao | 153 arquivo acima do teto | 137 SIGKILL (OOM e decidido pelo host)
# Ultima linha de stderr: `@@tplab-timing compile_ms=N simulate_ms=N` (removida pelo host).
set -u

TIMEOUT_S="${SIM_TIMEOUT_S:-10}"
COMPILE_TIMEOUT_S="${SIM_COMPILE_TIMEOUT_S:-5}"
WAVE=/work/wave.vcd
# Biblioteca de trabalho do GHDL (.cf e objetos): rootfs e somente leitura, /tmp e tmpfs.
WORKDIR=/tmp/ghdl-work

ulimit -f 32768
ulimit -n 64

now_cs() {
    cut -d' ' -f1 /proc/uptime | tr -d .
}

t_compile_start=0
t_compile_end=0
t_sim_start=0
t_sim_end=0

emit_timing() {
    out="@@tplab-timing"
    [ "$t_compile_end" -gt 0 ] && out="$out compile_ms=$(((t_compile_end - t_compile_start) * 10))"
    [ "$t_sim_end" -gt 0 ] && out="$out simulate_ms=$(((t_sim_end - t_sim_start) * 10))"
    echo "$out" >&2
}
trap emit_timing EXIT

reached_limit() {
    [ $(($2 - $1)) -ge $(($3 * 100)) ]
}

FILES=""
for file in /work/*.vhd /work/*.vhdl; do
    [ -f "$file" ] && FILES="$FILES $file"
done

if [ -z "$FILES" ]; then
    echo "Nenhum arquivo .vhd ou .vhdl encontrado em /work" >&2
    exit 2
fi

mkdir -p "$WORKDIR"

# 1) analise (compilacao). Sem topo informado, o GHDL elege o topo na elaboracao (--find-top).
# shellcheck disable=SC2086
t_compile_start=$(now_cs)
timeout -s KILL "$COMPILE_TIMEOUT_S" ghdl -a --std=08 --workdir="$WORKDIR" $FILES
status=$?
if [ "$status" -eq 0 ]; then
    TOP=$(ghdl --find-top --std=08 --workdir="$WORKDIR" 2>/dev/null | head -n 1)
    if [ -z "$TOP" ]; then
        echo "Nao foi possivel identificar a entidade de topo (testbench)" >&2
        status=1
    else
        timeout -s KILL "$COMPILE_TIMEOUT_S" ghdl -e --std=08 --workdir="$WORKDIR" "$TOP"
        status=$?
    fi
fi
t_compile_end=$(now_cs)
if [ "$status" -ne 0 ]; then
    if [ "$status" -eq 137 ]; then
        reached_limit "$t_compile_start" "$t_compile_end" "$COMPILE_TIMEOUT_S" && exit 4
        exit 137
    fi
    exit 2
fi

# 2) simulacao: o VCD vai para /work (unico lugar gravavel e lido pelo host).
t_sim_start=$(now_cs)
timeout -s KILL "$TIMEOUT_S" ghdl -r --std=08 --workdir="$WORKDIR" "$TOP" --vcd="$WAVE"
status=$?
t_sim_end=$(now_cs)
if [ "$status" -eq 137 ]; then
    reached_limit "$t_sim_start" "$t_sim_end" "$TIMEOUT_S" && exit 124
    exit 137
fi
[ "$status" -eq 153 ] && exit 153
[ "$status" -ne 0 ] && exit 3
exit 0
