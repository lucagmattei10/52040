const fs = require('fs');
const path = require('path');
const { DSLLexer } = require('./DSLlexer');
const { DSLParser } = require('./DSLParser');
const { DSLInterpreter } = require('./DSLInterpreter');

// ─── Utilidades de formato ───────────────────────────────────

function separator(char = '─', width = 60) {
  return char.repeat(width);
}

function printHeader(title) {
  console.log('\n' + separator('═'));
  console.log(`  ${title}`);
  console.log(separator('═'));
}

// ─── 1. Tabla de Lexemas-Tokens ──────────────────────────────

function printTokenTable(tokens) {
  printHeader('TABLA DE LEXEMAS – TOKENS');
  const header = `${'N°'.padEnd(4)} ${'LEXEMA'.padEnd(35)} ${'TOKEN'.padEnd(35)} ${'LÍNEA'.padEnd(6)} ${'COL'}`;
  console.log(header);
  console.log(separator('-'));
  tokens.forEach((tok, i) => {
    if (tok.type === 'EOF') return;
    const row = `${String(i + 1).padEnd(4)} ${tok.lexeme.padEnd(35)} ${tok.type.padEnd(35)} ${String(tok.line).padEnd(6)} ${tok.column}`;
    console.log(row);
  });
}

// ─── 2. Árbol de Análisis Sintáctico ─────────────────────────

function printAST(node, indent = '', isLast = true) {
  if (!node) return;
  const prefix = indent + (isLast ? '└── ' : '├── ');
  const label = node.value !== null ? `[${node.type}] "${node.value}"` : `[${node.type}]`;
  console.log(prefix + label);
  const childIndent = indent + (isLast ? '    ' : '│   ');
  node.children.forEach((child, idx) => {
    printAST(child, childIndent, idx === node.children.length - 1);
  });
}

// ─── 3. Errores ──────────────────────────────────────────────

function printErrors(lexErrors, parseErrors) {
  const allErrors = [
    ...lexErrors.map(e => ({ tipo: 'LÉXICO', ...e })),
    ...parseErrors.map(e => ({ tipo: 'SINTÁCTICO', ...e })),
  ].sort((a, b) => a.line - b.line || a.column - b.column);

  if (allErrors.length === 0) {
    console.log('\n✅  Sin errores léxicos ni sintácticos.');
    return false;
  }

  printHeader('ERRORES ENCONTRADOS');
  allErrors.forEach(err => {
    console.log(`  [ERROR ${err.tipo}] Línea ${err.line}, Col ${err.column}: ${err.message}`);
  });
  return true;
}

// ─── Main ────────────────────────────────────────────────────

function main() {
  // Leer archivo de entrada
  const inputPath = process.argv[2] || path.join(__dirname, '..', 'input.txt');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌  Archivo no encontrado: ${inputPath}`);
    console.error('    Uso: node src/main.js [ruta/al/input.txt]');
    process.exit(1);
  }

  const source = fs.readFileSync(inputPath, 'utf-8');

  console.log(separator('═'));
  console.log('  ANALIZADOR DSL  –  Tema 25914_12');
  console.log(`  Archivo: ${inputPath}`);
  console.log(separator('═'));
  console.log('\n📄  CÓDIGO FUENTE:');
  console.log(separator('-'));
  source.split('\n').forEach((line, i) => {
    console.log(`  ${String(i + 1).padStart(3)}: ${line}`);
  });

  // ── Fase 1: Análisis Léxico ──
  const lexer = new DSLLexer(source);
  const tokens = lexer.tokenize();
  printTokenTable(tokens);

  // ── Fase 2: Análisis Sintáctico ──
  const parser = new DSLParser(tokens);
  const ast = parser.parse();

  printHeader('ÁRBOL DE ANÁLISIS SINTÁCTICO');
  printAST(ast);

  // ── Errores ──
  const hasErrors = printErrors(lexer.errors, parser.errors);

  if (!hasErrors) {
    // ── Fase 3: Interpretación ──
    const interpreter = new DSLInterpreter(ast);
    const jsCode = interpreter.generateJS();

    printHeader('CÓDIGO JAVASCRIPT GENERADO');
    jsCode.split('\n').forEach((line, i) => {
      console.log(`  ${String(i + 1).padStart(3)}: ${line}`);
    });

    printHeader('RESULTADO DE EJECUCIÓN');
    const logs = interpreter.execute(jsCode);
    if (logs.length === 0) {
      console.log('  (Sin salida de ejecución)');
    } else {
      logs.forEach(l => console.log(`  > ${l}`));
    }

    // Guardar código generado
    const outPath = path.join(__dirname, '..', 'output', 'generated.js');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, jsCode, 'utf-8');
    console.log(`\n💾  Código JS guardado en: ${outPath}`);
  }

  printHeader('ANÁLISIS COMPLETADO');
}

main();