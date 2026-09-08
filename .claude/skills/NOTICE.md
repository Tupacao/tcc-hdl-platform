# Origem das skills

As pastas deste diretorio foram copiadas de
<https://github.com/alirezarezvani/claude-skills> (MIT, (c) 2025 Alireza Rezvani),
em 2026-09-07, e ficam versionadas junto com o repositorio de proposito: a
configuracao vale apenas para este projeto, sem instalacao global.

| Skill                | Origem no upstream                        | Por que esta aqui                                      |
| -------------------- | ----------------------------------------- | ------------------------------------------------------ |
| `a11y-audit`         | `engineering-team/a11y-audit`             | RNF09 exige WCAG AA de contraste nos dois temas (RF10) |
| `docker-development` | `engineering/docker-development`          | Sandbox e compose sao o nucleo critico (RNF04/RNF05)   |
| `senior-frontend`    | `engineering-team/skills/senior-frontend` | React 19 + Tailwind; RF06 (waveform) ainda pendente    |
| `senior-backend`     | `engineering-team/skills/senior-backend`  | Fastify + PostgreSQL; persistencia com Prisma pendente |

**Os scripts `scripts/*.py` destas skills nao rodam nesta maquina** — nao ha Python
instalado. As instrucoes e os `references/*.md` funcionam normalmente; apenas a
automacao em Python fica indisponivel ate instalar Python 3.
