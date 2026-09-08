# RF01-I03 - Verificacao de acesso em maquina limpa e documentacao

| Campo | Valor |
| --- | --- |
| Feature | [RF01](feature.md) |
| Branch | `chore/rf01-verificacao-acesso-limpo` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | RF01-I02 |

## Contexto

RF01 e um requisito verificavel por observacao: ou um terceiro consegue usar a
plataforma sem instalar nada, ou nao. Essa evidencia precisa existir para a
defesa do TCC.

## Objetivo

Executar e registrar o roteiro de validacao de RF01 em ambiente sem dependencias
do projeto instaladas.

## Escopo tecnico

- `docs/requisitos/funcional/RF01/` - registro da execucao e evidencias.
- `README.md` - URL publica e instrucoes para o avaliador.

## Passo a passo

1. Em uma maquina (ou perfil de navegador) sem Node, Docker ou toolchain HDL,
   abrir a URL publica.
2. Percorrer: abrir a aplicacao, usar um exemplo, simular, ver o console de
   erros, ver a forma de onda, criar e renomear um projeto.
3. Registrar o tempo ate a primeira simulacao bem-sucedida.
4. Anexar capturas de tela e anotar qualquer bloqueio encontrado.
5. Atualizar o `README.md` com a URL publica e um paragrafo "para avaliadores".

## Criterios de aceite

- [ ] Roteiro executado ponta a ponta sem nenhuma instalacao local.
- [ ] Evidencias (capturas e tempos) versionadas nesta pasta.
- [ ] `README.md` traz a URL publica.
- [ ] Qualquer bloqueio encontrado virou issue nova, referenciada aqui.

## Riscos

- Rede de laboratorio pode bloquear portas ou dominios; testar tambem em rede
  restrita se a demonstracao for nesse ambiente.
