# Imagem do sandbox de execucao HDL (RNF04).
# Build: docker build -t hdl-sandbox:latest infra/sandbox
FROM alpine:3.20

RUN apk add --no-cache iverilog \
    && adduser -D -u 10001 sandbox

COPY run-simulation.sh /usr/local/bin/run-simulation.sh
RUN chmod 0555 /usr/local/bin/run-simulation.sh

USER sandbox
WORKDIR /work

ENTRYPOINT ["/usr/local/bin/run-simulation.sh"]
