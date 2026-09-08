import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/editor/editor.all.js';
// Apenas as linguagens usadas — evita carregar as ~90 basic-languages do Monaco.
// Esta contribuicao registra os ids 'verilog' e 'systemverilog'.
import 'monaco-editor/esm/vs/basic-languages/systemverilog/systemverilog.contribution.js';
import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

/**
 * Carrega o Monaco do bundle local em vez do CDN padrao — a plataforma precisa
 * funcionar em rede restrita de laboratorio. O destaque de sintaxe de Verilog
 * (RF02) vem das basic-languages do proprio Monaco.
 */
self.MonacoEnvironment = { getWorker: () => new editorWorker() };
loader.config({ monaco });

export const VERILOG_LANGUAGE_ID = 'verilog';
