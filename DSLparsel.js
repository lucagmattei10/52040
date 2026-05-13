const { TokenType } = require('./DSLLexer');

class ParseError {
  constructor(message, line, column, found) {
    this.message = message;
    this.line = line;
    this.column = column;
    this.found = found;
  }
}

// ─── Nodos del AST ───────────────────────────────────────────

class DSLNode {
  constructor(type, children = [], value = null, line = 0) {
    this.type = type;
    this.children = children;
    this.value = value;
    this.line = line;
  }
}

// ─── Parser ──────────────────────────────────────────────────

class DSLParser {
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== TokenType.ERROR);
    this.pos = 0;
    this.errors = [];
  }

  peek() {
    return this.tokens[this.pos] || { type: TokenType.EOF, lexeme: '', line: 0, column: 0 };
  }

  consume(expectedType) {
    const tok = this.peek();
    if (tok.type === expectedType) {
      this.pos++;
      return tok;
    }
    const err = new ParseError(
      `Se esperaba '${expectedType}' pero se encontró '${tok.lexeme || tok.type}' (${tok.type})`,
      tok.line, tok.column, tok.lexeme
    );
    this.errors.push(err);
    // Recuperación de errores: avanzar para no quedar en loop infinito
    if (tok.type !== TokenType.EOF) this.pos++;
    return tok;
  }

  // dsl ::= regla+ accion+
  parseDSL() {
    const node = new DSLNode('DSL', [], null, 1);

    // Al menos una regla
    if (this.peek().type !== TokenType.REGLA) {
      this.errors.push(new ParseError(
        `Se esperaba al menos una 'regla'`,
        this.peek().line, this.peek().column, this.peek().lexeme
      ));
    }
    while (this.peek().type === TokenType.REGLA) {
      node.children.push(this.parseRegla());
    }

    // Al menos una accion
    if (this.peek().type !== TokenType.ACCION) {
      this.errors.push(new ParseError(
        `Se esperaba al menos una 'accion'`,
        this.peek().line, this.peek().column, this.peek().lexeme
      ));
    }
    while (this.peek().type === TokenType.ACCION) {
      node.children.push(this.parseAccion());
    }

    this.consume(TokenType.EOF);
    return node;
  }

  // regla ::= 'regla' '\'' identificador '\'' '{' 'cuando' condicion 'entonces' comando '}'
  parseRegla() {
    const tok = this.peek();
    const node = new DSLNode('Regla', [], null, tok.line);
    this.consume(TokenType.REGLA);
    this.consume(TokenType.COMILLA_SIMPLE);
    const id = this.parseIdentificador();
    node.value = id.value;
    this.consume(TokenType.COMILLA_SIMPLE);
    this.consume(TokenType.LLAVE_ABRE);
    this.consume(TokenType.CUANDO);
    node.children.push(this.parseCondicion());
    this.consume(TokenType.ENTONCES);
    node.children.push(this.parseComando());
    this.consume(TokenType.LLAVE_CIERRA);
    return node;
  }

  // accion ::= 'accion' '\'' identificador '\'' '{' '}'
  parseAccion() {
    const tok = this.peek();
    const node = new DSLNode('Accion', [], null, tok.line);
    this.consume(TokenType.ACCION);
    this.consume(TokenType.COMILLA_SIMPLE);
    const id = this.parseIdentificador();
    node.value = id.value;
    this.consume(TokenType.COMILLA_SIMPLE);
    this.consume(TokenType.LLAVE_ABRE);
    this.consume(TokenType.LLAVE_CIERRA);
    return node;
  }

  // condicion ::= accesoNoAutorizado | multiplesIntentosFallidos | actividadSospechosa
  parseCondicion() {
    const tok = this.peek();
    switch (tok.type) {
      case TokenType.INTENTO_ACCESO_FUERA_HORARIO:
        return this.parseAccesoNoAutorizado();
      case TokenType.INTENTOS_FALLIDOS:
        return this.parseMultiplesIntentosFallidos();
      case TokenType.ACCESO_RECURSOS_SENSIBLES:
        return this.parseActividadSospechosa();
      default:
        this.errors.push(new ParseError(
          `Condición inválida: '${tok.lexeme}'`,
          tok.line, tok.column, tok.lexeme
        ));
        if (tok.type !== TokenType.EOF) this.pos++;
        return new DSLNode('CondicionError', [], tok.lexeme, tok.line);
    }
  }

  parseAccesoNoAutorizado() {
    const tok = this.consume(TokenType.INTENTO_ACCESO_FUERA_HORARIO);
    return new DSLNode('AccesoNoAutorizado', [], tok.lexeme, tok.line);
  }

  parseMultiplesIntentosFallidos() {
    const tok = this.peek();
    const node = new DSLNode('MultiplesIntentosFallidos', [], null, tok.line);
    this.consume(TokenType.INTENTOS_FALLIDOS);
    this.consume(TokenType.MAYOR_QUE);
    const digTok = this.consume(TokenType.DIGITO);
    node.value = digTok.lexeme;
    node.children.push(new DSLNode('Digito', [], digTok.lexeme, digTok.line));
    return node;
  }

  parseActividadSospechosa() {
    const tok = this.peek();
    const node = new DSLNode('ActividadSospechosa', [], null, tok.line);
    this.consume(TokenType.ACCESO_RECURSOS_SENSIBLES);
    this.consume(TokenType.Y);
    this.consume(TokenType.NO_ES_ADMINISTRADOR);
    return node;
  }

  // comando ::= 'agregarUsuarioAListaNegra' | 'agregarIPAListaNegra' | 'activarMonitoreoDetallado'
  parseComando() {
    const tok = this.peek();
    const comandos = [
      TokenType.AGREGAR_USUARIO_LISTA_NEGRA,
      TokenType.AGREGAR_IP_LISTA_NEGRA,
      TokenType.ACTIVAR_MONITOREO_DETALLADO,
    ];
    if (comandos.includes(tok.type)) {
      this.pos++;
      return new DSLNode('Comando', [], tok.lexeme, tok.line);
    }
    this.errors.push(new ParseError(
      `Comando inválido: '${tok.lexeme}'`,
      tok.line, tok.column, tok.lexeme
    ));
    if (tok.type !== TokenType.EOF) this.pos++;
    return new DSLNode('ComandoError', [], tok.lexeme, tok.line);
  }

  // identificador ::= LETRA (LETRA | DIGITO)*
  parseIdentificador() {
    const tok = this.peek();
    // El identificador puede ser un token IDENTIFICADOR o una palabra clave usada como nombre
    if (tok.type === TokenType.IDENTIFICADOR || Object.values(TokenType).includes(tok.type)) {
      this.pos++;
      return new DSLNode('Identificador', [], tok.lexeme, tok.line);
    }
    this.errors.push(new ParseError(
      `Se esperaba un identificador pero se encontró '${tok.lexeme}'`,
      tok.line, tok.column, tok.lexeme
    ));
    return new DSLNode('IdentificadorError', [], tok.lexeme, tok.line);
  }

  parse() {
    return this.parseDSL();
  }
}

module.exports = { DSLParser, DSLNode, ParseError };