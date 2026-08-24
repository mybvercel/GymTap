# Graph Report - .  (2026-08-24)

## Corpus Check
- Corpus is ~7,109 words - fits in a single context window. You may not need a graph.

## Summary
- 192 nodes · 287 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.5)
- Token cost: 46,000 input · 10,000 output

## Community Hubs (Navigation)
- Pantalla de estacion y pruebas
- Herramientas de desarrollo
- Dependencias de la app
- Inicio, historial y sesion
- Configuracion de TypeScript
- Rutas: etiqueta, panel y QR
- Decision: datos locales sin backend
- Decision: el tap y el descanso
- Alcance de compilacion
- Temporizador de descanso
- Layout y metadatos PWA
- Decision: NFC como mejora
- Notas de herramientas
- Configuracion de ESLint
- Configuracion de Next
- Configuracion de PostCSS

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `buscarEjercicio()` - 11 edges
3. `PantallaEstacion()` - 10 edges
4. `volumen()` - 8 edges
5. `include` - 7 edges
6. `scripts` - 6 edges
7. `ListaHistorial()` - 6 edges
8. `ResumenSesion()` - 6 edges
9. `resolverEstacion()` - 6 edges
10. `Sesion` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Icono de la app` --identifica-a--> `GymTap`  [INFERRED]
  public/icono.svg → README.md
- `PanelEstaciones()` --references--> `qrcode`  [EXTRACTED]
  src/components/PanelEstaciones.tsx → package.json
- `generateMetadata()` --calls--> `resolverEstacion()`  [EXTRACTED]
  src/app/e/[estacion]/page.tsx → src/lib/catalogo.ts
- `PaginaEstacion()` --calls--> `resolverEstacion()`  [EXTRACTED]
  src/app/e/[estacion]/page.tsx → src/lib/catalogo.ts
- `Inicio()` --calls--> `buscarEjercicio()`  [EXTRACTED]
  src/app/page.tsx → src/lib/catalogo.ts

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "Pantalla de estacion y pruebas"
Cohesion: 0.12
Nodes (25): CARGA, PantallaEstacion(), Props, repsIniciales(), guardarAjustes(), guardarSesionActiva(), leerAjustes(), ultimaCarga() (+17 more)

### Community 1 - "Herramientas de desarrollo"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 2 - "Dependencias de la app"
Cohesion: 0.10
Nodes (20): idb-keyval, next, dependencies, idb-keyval, next, qrcode, react, react-dom (+12 more)

### Community 3 - "Inicio, historial y sesion"
Cohesion: 0.18
Nodes (14): metadata, Inicio(), fecha(), ListaHistorial(), ResumenSesion(), archivarSesion(), borrarSesionActiva(), leerHistorial() (+6 more)

### Community 4 - "Configuracion de TypeScript"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 5 - "Rutas: etiqueta, panel y QR"
Cohesion: 0.22
Nodes (8): generateMetadata(), PaginaEstacion(), metadata, PanelEstaciones(), sinCambios(), buscarEstacion(), ESTACIONES, resolverEstacion()

### Community 6 - "Decision: datos locales sin backend"
Cohesion: 0.15
Nodes (13): almacen.ts es lo único que toca el disco, Catálogo de ejercicios y estaciones en código, La estación no es el ejercicio, Estado: prototipo funcionando, El gimnasio no tiene señal, Historial atado al dispositivo, Historial con filtros, Persistencia local en IndexedDB (+5 more)

### Community 7 - "Decision: el tap y el descanso"
Cohesion: 0.18
Nodes (12): El descanso se mide, no se pide, GymTap, El navegador frena los intervalos con la pantalla bloqueada, Cada lectura siguiente registra una serie, Probar el flujo sin etiquetas, Primera lectura abre el ejercicio, Icono de la app, Rebote de lectura NFC (+4 more)

### Community 8 - "Alcance de compilacion"
Cohesion: 0.18
Nodes (10): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, pruebas, **/*.ts, **/*.tsx (+2 more)

### Community 9 - "Temporizador de descanso"
Cohesion: 0.47
Nodes (5): avisar(), Descanso(), formatear(), Props, DESCANSOS

### Community 10 - "Layout y metadatos PWA"
Cohesion: 0.40
Nodes (3): inter, metadata, viewport

### Community 11 - "Decision: NFC como mejora"
Cohesion: 0.67
Nodes (4): Panel del gimnasio, QR como camino universal, Web NFC es una mejora, no un requisito, Web NFC solo en Chrome sobre Android con HTTPS

## Knowledge Gaps
- **70 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PanelEstaciones()` connect `Rutas: etiqueta, panel y QR` to `Dependencias de la app`, `Inicio, historial y sesion`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `qrcode` connect `Dependencias de la app` to `Rutas: etiqueta, panel y QR`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _70 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Pantalla de estacion y pruebas` be split into smaller, more focused modules?**
  _Cohesion score 0.11932773109243698 - nodes in this community are weakly interconnected._
- **Should `Herramientas de desarrollo` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Dependencias de la app` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Configuracion de TypeScript` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._