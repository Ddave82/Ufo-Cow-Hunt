# Grafiküberarbeitung vom 9. September 2026

## Gesicherter alter Stand

Vor der ersten Grafikänderung wurde der vollständige versionierte Arbeitsstand auf
`backup/pre-visual-refresh-2026-09-09` gesichert. Commit: `d2dad14`.
Auch die zuvor vorhandene Änderung an `package-lock.json` ist darin enthalten.
Die Überarbeitung liegt getrennt auf `codex/visual-refresh`. Beide Stände sind lokal.

Zur alten Version wechseln (Entwicklungsserver vorher mit Ctrl+C stoppen):

```sh
git switch backup/pre-visual-refresh-2026-09-09
npm run dev
```

Zur neuen Version zurück:

```sh
git switch codex/visual-refresh
npm run dev
```

Spätere eigene Änderungen zuerst committen oder mit `git stash push -u` sichern.
Zum Neuaufbau der jeweiligen Version `npm run build` verwenden; `dist/` ist ein
nicht versioniertes Build-Verzeichnis. Es wurde nichts veröffentlicht.

## Änderungen

- Neues Scout-07-UFO: gestufter Keramikrumpf, dunkle Unterseite, Kupferfassungen,
  radiale Paneele, segmentierter Leuchtrand, transparente Kabine mit winkelabhängigen
  Reflexen und sichtbarem Piloten. Feste Details werden pro Material zusammengeführt.
- Kühe, Kamele und Eisbären mit dezent abgerundeten Körpern und Köpfen;
  Kühe zusätzlich mit Ohren und Schwanz. Bestehendes Material-Batching bleibt erhalten.
- Abgestimmte Himmelspaletten für alle drei Missionen und eine ruhigere Licht- und
  Geländefarbgebung für die Farm.
- Neues Hauptmenü mit freier Sicht auf die Spielwelt, kompakteres HUD,
  Missionskarten mit Landschaftsmotiven und besser lesbare Instrumente.
- Keine zusätzlichen Texturen, Lichtquellen oder Postprocessing-Pässe.
  Renderauflösung, Schattenauflösung und AO-Samples bleiben unverändert.
  CSS-Hintergrundunschärfe entfällt. Bewegungsreduzierung wird berücksichtigt.

Steuerung, Flugphysik, Punkte, Wellen, Gegner und Sounds wurden nicht geändert.

## Messbare Modellbudgets

Reproduzierbarer Vergleich mit dem Backup-Branch:

```sh
node scripts/check-ufo-budget.mjs
```

| UFO | Vorher | Nachher |
| --- | ---: | ---: |
| Meshes | 32 | 10 |
| Dreiecke einschließlich Instanzen | 22.366 | 7.976 |
| Dreiecke schattenwerfender Teile | 9.620 | 4.320 |
| Transparente Meshes | 10 | 3 |

Das sind rund 64 % weniger UFO-Dreiecke. Die zusätzlichen Tierdetails bleiben
auch bei der maximalen Wellenstärke vollständig innerhalb dieser Ersparnis:

| UFO + 20 Tiere | Vorher | Nachher | Meshes je Tier vorher/nachher |
| --- | ---: | ---: | ---: |
| Kühe | 28.606 | 18.776 | 7 / 7 |
| Kamele | 53.886 | 43.336 | 5 / 5 |
| Eisbären | 33.286 | 22.736 | 7 / 7 |

Der Check prüft außerdem endliche Vertex-Koordinaten, Schattenbudgets,
Modellabmessungen, die Ausrichtung der Rumpfflächen und die für die bestehenden
Animationen erforderlichen Objekte.

## Browserprüfung

Lokaler Codex-Browser, 1280 × 720, DPR 1, normale Qualität, normale Schwierigkeit.
Alte und neue Version wurden nacheinander im selben Browserfenster geprüft.
Das Diagnose-Overlay zeigt mit `?perfDebug=1` zusätzlich Median und 95. Perzentil
der letzten 240 Framezeiten; die ersten drei Sekunden werden nicht aufgenommen.
Der alte Stand wurde nur in einer temporären Testkopie mit derselben
Framezeitmessung instrumentiert; der Backup-Commit bleibt unverändert.

Die Messwerte stammen aus den laufenden Missionsvorschauen nach dem Aufwärmen.
Sie sind ein lokaler Vergleich, keine FPS-Garantie für sämtliche Geräte.
Zufällige Tierpositionen und bewegte Drohnen verändern die Szenenzähler;
die exakten Einsparungen werden separat mit dem Modellbudget-Check abgesichert.

| Mission | FPS vorher / nachher | Frame-Median vorher / nachher | p95 vorher / nachher | Draws vorher / nachher |
| --- | ---: | ---: | ---: | ---: |
| Farm | 60 / 60 | 16,6 / 16,7 ms | 17,6 / 17,6 ms | 507 / 436 |
| Wüste | 60 / 60 | 16,7 / 16,7 ms | 17,6 / 17,6 ms | 560 / 494 |
| Eis | 60 / 60 | 16,6 / 16,7 ms | 17,6 / 17,4 ms | 732 / 642 |

Die Framezeiten sind im lokalen Test praktisch gleich geblieben. Das 60-Hz-Limit
verdeckt mögliche zusätzliche FPS; die geringere Geometrie und die reduzierten
Zeichenaufrufe schaffen zusätzliche Reserve. Aus den zufallsabhängigen
Szenenzählern wird keine feste prozentuale FPS-Steigerung abgeleitet.

Geprüft: Darstellung aller drei Missionen, Missionsauswahl, Missionsstart,
Traktorstrahl mit Energieverbrauch, Pause/Einstellungen, Menü-Rückkehr und
Hauptmenü/Missionsauswahl bei 390 × 844 ohne horizontalen Überlauf.
Die übrige Spiellogik wurde nicht verändert; ein vollständiger Durchlauf sämtlicher
Wellen wurde nicht automatisiert gespielt.

`npm run build`, `npm run build:pages` und `git diff --check` erfolgreich.
Vite meldet weiterhin den Hinweis zum großen Three.js-Bundle; keine Buildfehler.

Auch der erzwungene Kompatibilitätsmodus (`?perfDebug=1&forceItchCompat=1`)
wurde mit Missionsstart, Tastatureingaben und sichtbarem Strahl geprüft: keine
Browser-/Shaderfehler, AO-Auflösung wie vorgesehen 563 × 316, Vorschau bei
60 FPS (Median 16,7 ms, p95 17,5 ms). Dies prüft den Rendering-Pfad lokal,
nicht eine tatsächliche Veröffentlichung in einem itch.io-Iframe.

## Korrektur: Startbutton in niedrigen Fenstern

Der Startbutton heißt jetzt eindeutig „Start Game“. Die kompakte Menüansicht
wird auch bei schmalen, niedrigen Fenstern aktiviert; bei höchstens 480 px Höhe
entfallen dekorative Zusatztexte und die Nebenaktionen stehen nebeneinander.
Vorher lag der Button bei 390 × 320 unterhalb des sichtbaren Menübereichs.
Nach der Korrektur sind Sichtbarkeit und Klickziel bei 320 × 480, 390 × 320,
640 × 360 und 1280 × 720 geprüft. Ein echter Klick führte zu `PLAYING` mit
laufendem Wellentimer. Produktionsbuild erfolgreich.
