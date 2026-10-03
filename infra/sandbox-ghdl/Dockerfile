# Imagem do sandbox GHDL — segunda toolchain, prova de conceito de RNF08-I02.
# O Alpine nao empacota GHDL; Debian slim com o backend mcode (sem LLVM/GCC, imagem menor).
# Build: docker build -t tplab-sandbox-ghdl:latest infra/sandbox-ghdl
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ghdl-mcode \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --no-create-home --shell /usr/sbin/nologin --uid 10001 sandbox

COPY run-simulation.sh /usr/local/bin/run-simulation.sh
RUN chmod 0555 /usr/local/bin/run-simulation.sh

USER sandbox
WORKDIR /work

ENTRYPOINT ["/usr/local/bin/run-simulation.sh"]
