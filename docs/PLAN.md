# HexaBlock Suite — Plan de trabajo

Entrega: lunes 14 de diciembre de 2026.

## Quién hace qué

| Persona | Primero | Después |
| --- | --- | --- |
| **Andrea** | API completa: auth con JWT, progreso, leaderboard, niveles, Swagger | Cliente HTTP, persistencia local, Hexa Merge, CI y APK |
| **Matias** | Motor genérico | Hexa Lines, Hexa Fit y Hexa Sort |
| **Isabella** | Casos de uso, AOP y adaptadores (view models, mappers) | Pantallas compartidas, render del tablero, sonido e idiomas |

## Calendario

Las fechas son estimadas e indican cuándo la actividad debe estar fusionada en `develop`.
Dentro de cada etapa, las actividades están ordenadas por cuánto trabajo ajeno desbloquean.

### Etapa 1 — Contratos (21 al 25 de noviembre)

| Fecha | Actividad | Responsable | Desbloquea |
| --- | --- | --- | --- |
| dom 22 nov | Elegir el stack de la API y del juego | Los tres | Todo lo demás |
| mar 24 nov | Interfaces genéricas del motor (`HexBoard`, `IGameRules`, `GameEngine`, `IPieceSource`, `IScoringPolicy`) | Los tres, lidera Matias | Variantes y casos de uso |
| mar 24 nov | Contrato de la API en OpenAPI: auth, progreso, leaderboard, niveles | Los tres, lidera Andrea | API y cliente HTTP |
| mié 25 nov | CI en ambos repositorios: lint, tests y build | Andrea | Todos los pull requests |
| mié 25 nov | Puertos de los casos de uso: progreso local, progreso remoto, leaderboard, niveles | Isabella | Cliente HTTP y persistencia local |

### Etapa 2 — Base (26 de noviembre al 1 de diciembre)

| Fecha | Actividad | Responsable | Desbloquea |
| --- | --- | --- | --- |
| sáb 28 nov | Motor genérico, probado con un tipo de celda falso | Matias | Las cuatro variantes y el render |
| sáb 28 nov | API: auth y progreso | Andrea | Cliente HTTP |
| dom 29 nov | Casos de uso genéricos, probados contra fakes | Isabella | Pantalla de juego y AOP |
| mar 1 dic | Hexa Lines | Matias | Primera partida jugable |
| mar 1 dic | API: leaderboard, niveles y Swagger | Andrea | Cliente HTTP completo |
| mar 1 dic | AOP sobre los casos de uso; navegación, inicio y selector de juego | Isabella | — |

### Etapa 3 — Variantes e integración (2 al 9 de diciembre)

| Fecha | Actividad | Responsable | Desbloquea |
| --- | --- | --- | --- |
| jue 3 dic | Render del tablero y pantalla de juego: Hexa Lines jugable de punta a punta | Isabella | Probar en pantalla cualquier variante |
| jue 3 dic | Cliente HTTP y repositorios remotos | Andrea | Sincronización y leaderboard en la app |
| vie 4 dic | Hexa Fit y sus 15 niveles | Matias | Selección de niveles |
| sáb 5 dic | Persistencia local | Andrea | Progreso guardado y niveles bloqueados |
| dom 6 dic | Selección de niveles, pantallas de victoria y derrota | Isabella | — |
| mar 8 dic | Hexa Sort y sus 10 niveles | Matias | — |
| mié 9 dic | Hexa Merge | Andrea | — |
| mié 9 dic | Sonido, idiomas y ajustes | Isabella | — |

### Etapa 4 — Cierre (10 al 14 de diciembre)

| Fecha | Actividad | Responsable |
| --- | --- | --- |
| jue 10 dic | Funcionalidad congelada: las cuatro variantes jugables y con progreso sincronizado | Los tres |
| sáb 12 dic | README, diagramas, `docs/EXTENSIBILITY.md`, `AI_USAGE.md` y tests pendientes | Los tres |
| sáb 12 dic | APK de release y pull request de `develop` a `main` | Andrea |
| dom 13 dic | Prueba completa en un dispositivo; día de margen | Los tres |
| lun 14 dic | Entrega | Los tres |

## Puntos de control

- **sáb 28 nov — motor genérico.** Es la ruta crítica: si no está, se atrasan las cuatro variantes y la pantalla de juego. Ese día se decide si alguien más entra a ayudar.
- **mar 1 dic — API cerrada.** Si no lo está, se decide quién toma Hexa Merge.
- **jue 3 dic — Hexa Lines jugable de punta a punta.** Confirma que motor, casos de uso y render encajan antes de sumar las otras tres variantes.

## Qué incluye cada pieza

- **Una variante** son sus reglas, su puntuación, sus tests y, en Hexa Fit y Hexa Sort, sus archivos de niveles. Se agrega con clases nuevas, sin tocar el motor.
- **Cliente HTTP** es el consumo de la API desde el juego: la librería de red, el envío del JWT y los repositorios remotos.
- **Persistencia local** es guardar en el dispositivo el progreso por variante: niveles completados, estrellas y puntuaciones.
- **Límite entre Isabella y Andrea:** Isabella define el puerto que necesita cada caso de uso y Andrea lo implementa contra la API o la base local.

## Entre todos

- Cada quien escribe los tests de su parte dentro de la misma actividad, no al final.
- Todo cambio entra por pull request a `develop` (ver `CONTRIBUTING.md` en cada repositorio).
