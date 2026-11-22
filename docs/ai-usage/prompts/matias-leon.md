# AI prompt log — Matias Leon

Raw, automatic log of every prompt sent to Claude Code in this repository
(written by `.claude/hooks/log-prompt.mjs`). Do not edit by hand. Curated entries live in `AI_USAGE.md`.

<!-- The two entries below were added manually: that session ran from the parent folder,
     before this hook existed. Times are approximate. -->

## 2026-11-21 16:56 UTC-04:00 (approx.) · `chore/project-harness` · session `b06e3425`

> Revisa el enunciado del proyecto, sobre todo revisa como se solicita la estructuracion del ptoyecto, la documentación necesaria, el ci/cd, el uso y registro de IA, la documentacion, los readme, la frecuencia y convencion de nombramiento y uso de git, el uso de las branches.   Con toda esta configuracion, quiero que en las dos carpetas de los repos de este proyecto (api y mobile) configures un arnes agentico para cada uno para que yo y mi equipo podamos realizar este proyecto usando claude code y cumpliendo con lo pedido en el proyecto, me interesa sobre todo automatizar la revision de commits correctamente nombrados, seguimiento de las convenciones, ramas y pull request, evitando directamente pushes, hooks para tener un log automatico del registro de uso de ia, colocando en un archivo cada prompt, con su fecha (en archivos independientes por cada miembro del proyecto) y el resto de cosas maspara poder trabajar en equipo eficientemente, guiate sobre todo de la estrucutra de estos dos repos  que fueron l mejor proyecto del semestre pasado: https://github.com/LevinJimenez/ucab-arrowmaze-api; https://github.com/ACifuentesH/ucab-arrowmaze-mobile. El objetivo no es que coloques toda la documentacion de una vez, solo define el ambiente de configuracion para empezar a trabajar de una vez (todavia no hemos decidido el lenguaje ni nada). Antes de todo, dime que es lo que piensas hacer.

## 2026-11-21 17:28 UTC-04:00 (approx.) · `chore/project-harness` · session `b06e3425`

> todas tienen windows o mac, puedes empeza

<!-- Added manually: this session ran from the parent folder, so the hook did not fire. Time is approximate. -->

## 2026-11-21 20:50 UTC-04:00 (approx.) · `chore/project-harness` · session `5a8eaad4`

> muy bien, a partir de ese archivo, quiero que en cada carpeta de los repos (api y game) crees un archivo .md con el disenio inicial que planteamos de cada uno (tanto api como game deben seguir clean architecture y tener capas de dominio etc..) ponle un nombre a estos archivos que se entienda que  no es ni siquiera una version inicial de la arquitectura, es como un primer acercamiento o planteamiento de solucion inicial, tambien indica que fue algo genera con IA para visualizar o tener ideas de como plantear una solucion. la idea es tener un punto de partida.

## 2026-11-22 11:31:00 UTC-04:00 · `docs/testing-guidelines` · session `be90afb5` (added by hand: session started outside the repository)

> agrega en los claude.md que se seguira TDD, y se realizaran pruebas unitarias (siguiendo AAA y la convencion should_[resultado_esperado]_when_[condicion]), de integracion, UI y de contrato, ademas que las pruebas deben verificar comportamiento, no detalles de implementacion,es decir, que no sean fragiles, lee el apartado de pruebas del enunciado para garantizar que los agentes implementen el testing correctamente, haz PR de esto, luego modifica la configuracion para evitar que AI_USAGE crezca tanto, ahorita como esta, cada sesion crearia una nueva entrada en el archivo, que se mantenga mas resumido colocando los usos principales (por ejemplo, lo de esta sesion y las dos entradas anteriores podrian guardarse como una sola entrada de configuracion del arnes agentico)
