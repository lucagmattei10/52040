# Analizador DSL — Tema 25914_12
> Construcción de un Analizador con ANTLR4 y JavaScript

## Descripción

Analizador léxico y sintáctico para un DSL (Lenguaje Específico de Dominio) de seguridad, implementado con JavaScript siguiendo la gramática EBNF proporcionada. El analizador realiza las 4 fases requeridas:

1. **Análisis léxico y sintáctico** — con detección de errores por línea y columna
2. **Tabla de lexemas-tokens** — todos los tokens reconocidos durante el análisis léxico
3. **Árbol de análisis sintáctico** — representación textual del árbol concreto
4. **Interpretación** — traducción a JavaScript y ejecución como intérprete básico

---

## Estructura del Proyecto

```
analizador-dsl/
├── .vscode/
│   ├── launch.json        ← Configuraciones de depuración VS Code
│   └── tasks.json         ← Tareas de VS Code (Ctrl+Shift+B)
├── grammar/
│   └── DSL.g4             ← Gramática formal en notación ANTLR4
├── src/
│   ├── DSLLexer.js        ← Analizador léxico (tokenizador)
│   ├── DSLParser.js       ← Analizador sintáctico (parser recursivo)
│   ├── DSLInterpreter.js  ← Intérprete + generador de código JS
│   └── main.js            ← Punto de entrada principal
├── output/
│   └── generated.js       ← Código JS generado (se crea al ejecutar)
├── input.txt              ← Código fuente DSL de ejemplo (válido)
├── input_error.txt        ← Código fuente con errores (para probar)
├── package.json
└── README.md
```

---

## Gramática DSL

```ebnf
<DSL>       ::= <Regla>+ <Accion>+
<Regla>     ::= "regla" ' <Identificador> ' "{" "cuando" <Condicion> "entonces" <Comando> "}"
<Condicion> ::= <AccesoNoAutorizado> | <MultiplesIntentosFallidos> | <ActividadSospechosa>
<AccesoNoAutorizado>        ::= "intentoAccesoFueraHorario"
<MultiplesIntentosFallidos> ::= "intentosFallidos" ">" <Digito>
<ActividadSospechosa>       ::= "accesoARecursosSensibles" "y" "noEsAdministrador"
<Comando>   ::= "agregarUsuarioAListaNegra" | "agregarIPAListaNegra" | "activarMonitoreoDetallado"
<Identificador> ::= <Letra> (<Letra> | <Digito> | "_")*
```

---

## Requisitos

- **Node.js** v14 o superior
- No requiere dependencias externas (parser manual)

---

## Uso

### Opción 1 — Desde la terminal

```bash
# Analizar el archivo de ejemplo
node src/main.js input.txt

# Analizar un archivo propio
node src/main.js ruta/a/tu/archivo.txt

# Probar detección de errores
node src/main.js input_error.txt
```

### Opción 2 — Scripts npm

```bash
npm start           # Ejecuta con input.txt
npm run test-error  # Ejecuta con input_error.txt
```

### Opción 3 — VS Code

- **Ctrl+Shift+B** → Ejecuta la tarea "Analizar input.txt"
- **F5** → Abre el menú de depuración con las 3 configuraciones
- **Ctrl+Shift+P** → "Tasks: Run Task" para elegir cualquier tarea

---

## Ejemplo de Código DSL (input.txt)

```
regla 'bloqueo_acceso_ilegal' { cuando intentoAccesoFueraHorario entonces agregarUsuarioAListaNegra }
regla 'bloqueo_ip_sospechosa' { cuando intentosFallidos > 5 entonces agregarIPAListaNegra }
regla 'monitoreo_admin' { cuando accesoARecursosSensibles y noEsAdministrador entonces activarMonitoreoDetallado }
accion 'agregarUsuarioAListaNegra' { }
accion 'agregarIPAListaNegra' { }
accion 'activarMonitoreoDetallado' { }
```

### Traducción generada a JavaScript

```javascript
let intentoAccesoFueraHorario = true;
let intentosFallidos = 6;
let accesoARecursosSensibles = true;
let esAdministrador = false;
const listaNegra = new Set();
const listaNegraIP = new Set();

function gestionar_bloqueo_acceso_ilegal() {
  if (intentoAccesoFueraHorario) {
    const usuario = "usuario_sospechoso";
    listaNegra.add(usuario);
    console.log(`[SEGURIDAD] Usuario ${usuario} agregado a la lista negra.`);
  }
}
// ... demás reglas
```

### Salida de ejecución

```
[SEGURIDAD] Usuario usuario_sospechoso agregado a la lista negra.
[SEGURIDAD] IP 192.168.1.100 agregada a la lista negra.
[SEGURIDAD] Monitoreo detallado activado.
```

---

## Detección de Errores

El analizador reporta errores con línea y columna exactos:

**Léxicos** — Caracteres no reconocidos:
```
[ERROR LÉXICO] Línea 2, Col 29: Carácter no reconocido: '@'
```

**Sintácticos** — Construcciones inválidas:
```
[ERROR SINTÁCTICO] Línea 1, Col 69: Comando inválido: 'comandoInvalido'
[ERROR SINTÁCTICO] Línea 2, Col 33: Condición inválida: 'entonces'
```

---

## Tokens Reconocidos

| Categoría | Tokens |
|-----------|--------|
| Palabras clave | `REGLA`, `ACCION`, `CUANDO`, `ENTONCES`, `Y` |
| Condiciones | `INTENTO_ACCESO_FUERA_HORARIO`, `INTENTOS_FALLIDOS`, `ACCESO_RECURSOS_SENSIBLES`, `NO_ES_ADMINISTRADOR` |
| Comandos | `AGREGAR_USUARIO_LISTA_NEGRA`, `AGREGAR_IP_LISTA_NEGRA`, `ACTIVAR_MONITOREO_DETALLADO` |
| Literales | `IDENTIFICADOR`, `DIGITO` |
| Símbolos | `LLAVE_ABRE`, `LLAVE_CIERRA`, `COMILLA_SIMPLE`, `MAYOR_QUE` |

---

*Tema 25914_12 — Analizador con ANTLR4 y JavaScript*
