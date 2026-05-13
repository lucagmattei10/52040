const TokenType = {
  // Palabras clave
  REGLA: 'REGLA',
  ACCION: 'ACCION',
  CUANDO: 'CUANDO',
  ENTONCES: 'ENTONCES',
  Y: 'Y',

  // Condiciones
  INTENTO_ACCESO_FUERA_HORARIO: 'INTENTO_ACCESO_FUERA_HORARIO',
  INTENTOS_FALLIDOS: 'INTENTOS_FALLIDOS',
  ACCESO_RECURSOS_SENSIBLES: 'ACCESO_RECURSOS_SENSIBLES',
  NO_ES_ADMINISTRADOR: 'NO_ES_ADMINISTRADOR',

  // Comandos
  AGREGAR_USUARIO_LISTA_NEGRA: 'AGREGAR_USUARIO_LISTA_NEGRA',
  AGREGAR_IP_LISTA_NEGRA: 'AGREGAR_IP_LISTA_NEGRA',
  ACTIVAR_MONITOREO_DETALLADO: 'ACTIVAR_MONITOREO_DETALLADO',

  // Literales
  IDENTIFICADOR: 'IDENTIFICADOR',
  DIGITO: 'DIGITO',
  CADENA: 'CADENA',

  // Símbolos
  LLAVE_ABRE: 'LLAVE_ABRE',
  LLAVE_CIERRA: 'LLAVE_CIERRA',
  COMILLA_SIMPLE: 'COMILLA_SIMPLE',
  MAYOR_QUE: 'MAYOR_QUE',

  // Control
  EOF: 'EOF',
  ERROR: 'ERROR',
};

const KEYWORDS = {
  regla: TokenType.REGLA,
  accion: TokenType.ACCION,
  cuando: TokenType.CUANDO,
  entonces: TokenType.ENTONCES,
  y: TokenType.Y,
  intentoAccesoFueraHorario: TokenType.INTENTO_ACCESO_FUERA_HORARIO,
  intentosFallidos: TokenType.INTENTOS_FALLIDOS,
  accesoARecursosSensibles: TokenType.ACCESO_RECURSOS_SENSIBLES,
  noEsAdministrador: TokenType.NO_ES_ADMINISTRADOR,
  agregarUsuarioAListaNegra: TokenType.AGREGAR_USUARIO_LISTA_NEGRA,
  agregarIPAListaNegra: TokenType.AGREGAR_IP_LISTA_NEGRA,
  activarMonitoreoDetallado: TokenType.ACTIVAR_MONITOREO_DETALLADO,
};

class Token {
  constructor(type, lexeme, line, column) {
    this.type = type;
    this.lexeme = lexeme;
    this.line = line;
    this.column = column;
  }
}

class LexerError {
  constructor(message, line, column, lexeme) {
    this.message = message;
    this.line = line;
    this.column = column;
    this.lexeme = lexeme;
  }
}

class DSLLexer {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errors = [];
  }

  peek() {
    return this.pos < this.input.length ? this.input[this.pos] : null;
  }

  advance() {
    const ch = this.input[this.pos++];
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  isLetter(ch) {
    return /[a-zA-Z]/.test(ch);
  }

  isDigit(ch) {
    return /[0-9]/.test(ch);
  }

  isIdentChar(ch) {
    return /[a-zA-Z0-9_]/.test(ch);
  }

  isWhitespace(ch) {
    return /[ \t\r\n]/.test(ch);
  }

  skipWhitespace() {
    while (this.pos < this.input.length && this.isWhitespace(this.peek())) {
      this.advance();
    }
  }

  readIdentifierOrKeyword() {
    const startLine = this.line;
    const startCol = this.column;
    let lexeme = '';
    while (this.pos < this.input.length && this.isIdentChar(this.peek())) {
      lexeme += this.advance();
    }
    const type = KEYWORDS[lexeme] || TokenType.IDENTIFICADOR;
    return new Token(type, lexeme, startLine, startCol);
  }

  readDigit() {
    const startLine = this.line;
    const startCol = this.column;
    let lexeme = '';
    while (this.pos < this.input.length && this.isDigit(this.peek())) {
      lexeme += this.advance();
    }
    return new Token(TokenType.DIGITO, lexeme, startLine, startCol);
  }

  tokenize() {
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      const ch = this.peek();
      const startLine = this.line;
      const startCol = this.column;

      if (this.isLetter(ch)) {
        this.tokens.push(this.readIdentifierOrKeyword());
      } else if (this.isDigit(ch)) {
        this.tokens.push(this.readDigit());
      } else if (ch === '{') {
        this.advance();
        this.tokens.push(new Token(TokenType.LLAVE_ABRE, '{', startLine, startCol));
      } else if (ch === '}') {
        this.advance();
        this.tokens.push(new Token(TokenType.LLAVE_CIERRA, '}', startLine, startCol));
      } else if (ch === "'") {
        this.advance();
        this.tokens.push(new Token(TokenType.COMILLA_SIMPLE, "'", startLine, startCol));
      } else if (ch === '>') {
        this.advance();
        this.tokens.push(new Token(TokenType.MAYOR_QUE, '>', startLine, startCol));
      } else {
        // Carácter no reconocido → error léxico
        this.advance();
        this.errors.push(new LexerError(
          `Carácter no reconocido: '${ch}'`,
          startLine, startCol, ch
        ));
        this.tokens.push(new Token(TokenType.ERROR, ch, startLine, startCol));
      }
    }
    this.tokens.push(new Token(TokenType.EOF, '', this.line, this.column));
    return this.tokens;
  }
}

module.exports = { DSLLexer, Token, TokenType, LexerError, KEYWORDS };