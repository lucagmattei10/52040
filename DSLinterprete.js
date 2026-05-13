class DSLInterpreter {
  constructor(ast) {
    this.ast = ast;
    this.jsLines = [];
    this.executionLog = [];
  }

  // ─── Generación de código JS ─────────────────────────────

  generateJS() {
    this.jsLines = [];
    this.jsLines.push('// ── Código generado automáticamente por el intérprete DSL ──');
    this.jsLines.push('');

    // Estado global
    this.jsLines.push('let intentoAccesoFueraHorario = true;');
    this.jsLines.push('let intentosFallidos = 6;');
    this.jsLines.push('let accesoARecursosSensibles = true;');
    this.jsLines.push('let esAdministrador = false;');
    this.jsLines.push('const listaNegra = new Set();');
    this.jsLines.push('const listaNegraIP = new Set();');
    this.jsLines.push('');

    for (const child of this.ast.children) {
      if (child.type === 'Regla') {
        this.generateRegla(child);
      }
    }

    for (const child of this.ast.children) {
      if (child.type === 'Accion') {
        this.generateAccion(child);
      }
    }

    // Llamadas a las funciones generadas
    this.jsLines.push('');
    this.jsLines.push('// ── Ejecución ──');
    for (const child of this.ast.children) {
      if (child.type === 'Regla') {
        const fnName = this.toFunctionName(child.value);
        this.jsLines.push(`${fnName}();`);
      }
    }

    return this.jsLines.join('\n');
  }

  toFunctionName(name) {
    return 'gestionar_' + name;
  }

  generateRegla(node) {
    const fnName = this.toFunctionName(node.value);
    const condNode = node.children.find(c => this.isCondicion(c.type));
    const cmdNode = node.children.find(c => c.type === 'Comando');

    this.jsLines.push(`function ${fnName}() {`);
    this.jsLines.push(`  // Regla: ${node.value}`);

    const condJS = this.generateCondicion(condNode);
    this.jsLines.push(`  if (${condJS}) {`);
    this.generateComando(cmdNode, '    ');
    this.jsLines.push(`  }`);
    this.jsLines.push(`}`);
    this.jsLines.push('');
  }

  generateAccion(node) {
    this.jsLines.push(`// Acción registrada: ${node.value}`);
    this.jsLines.push(`function accion_${node.value}() { /* implementación personalizada */ }`);
    this.jsLines.push('');
  }

  isCondicion(type) {
    return ['AccesoNoAutorizado', 'MultiplesIntentosFallidos', 'ActividadSospechosa', 'CondicionError'].includes(type);
  }

  generateCondicion(node) {
    if (!node) return 'false';
    switch (node.type) {
      case 'AccesoNoAutorizado':
        return 'intentoAccesoFueraHorario';
      case 'MultiplesIntentosFallidos':
        return `intentosFallidos > ${node.value}`;
      case 'ActividadSospechosa':
        return 'accesoARecursosSensibles && !esAdministrador';
      default:
        return 'false';
    }
  }

  generateComando(node, indent = '') {
    if (!node) return;
    switch (node.value) {
      case 'agregarUsuarioAListaNegra':
        this.jsLines.push(`${indent}const usuario = "usuario_sospechoso";`);
        this.jsLines.push(`${indent}listaNegra.add(usuario);`);
        this.jsLines.push(`${indent}console.log(\`[SEGURIDAD] Usuario \${usuario} agregado a la lista negra.\`);`);
        break;
      case 'agregarIPAListaNegra':
        this.jsLines.push(`${indent}const ip = "192.168.1.100";`);
        this.jsLines.push(`${indent}listaNegraIP.add(ip);`);
        this.jsLines.push(`${indent}console.log(\`[SEGURIDAD] IP \${ip} agregada a la lista negra.\`);`);
        break;
      case 'activarMonitoreoDetallado':
        this.jsLines.push(`${indent}console.log("[SEGURIDAD] Monitoreo detallado activado.");`);
        break;
    }
  }

  // ─── Ejecución del código generado ──────────────────────

  execute(jsCode) {
    const logs = [];
    const originalLog = console.log;

    // Capturamos console.log
    console.log = (...args) => {
      logs.push(args.join(' '));
    };

    try {
      // eslint-disable-next-line no-new-func
      new Function(jsCode)();
    } catch (e) {
      logs.push(`[ERROR DE EJECUCIÓN] ${e.message}`);
    } finally {
      console.log = originalLog;
    }

    this.executionLog = logs;
    return logs;
  }
}

module.exports = { DSLInterpreter };