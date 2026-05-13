grammar DSL;

// ─── Parser ────────────────────────────────────────────────────────────

dsl         : regla+ accion+ EOF ;

regla       : 'regla' '\'' identificador '\'' '{' 'cuando' condicion 'entonces' comando '}' ;

accion      : 'accion' '\'' identificador '\'' '{' '}' ;

condicion   : accesoNoAutorizado
            | multiplesIntentosFallidos
            | actividadSospechosa
            ;

accesoNoAutorizado      : 'intentoAccesoFueraHorario' ;

multiplesIntentosFallidos : 'intentosFallidos' '>' DIGITO ;

actividadSospechosa     : 'accesoARecursosSensibles' 'y' 'noEsAdministrador' ;

comando     : 'agregarUsuarioAListaNegra'
            | 'agregarIPAListaNegra'
            | 'activarMonitoreoDetallado'
            ;

identificador : LETRA (LETRA | DIGITO)* ;

// ─── Lexer ─────────────────────────────────────────────────────────────

LETRA   : [a-zA-Z] ;
DIGITO  : [0-9] ;

WS      : [ \t\r\n]+ -> skip ;

// ─── Fragments ───────────────────────────────────────────────────────────────

fragment CARACTER : LETRA | DIGITO | '_' | '-' | '/' ;
