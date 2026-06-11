# UFO Cow Hunt

Ein kleines 3D-Browsergame mit Three.js: Fliege nachts mit einem UFO ueber eine Landschaft, suche Kuehe und sammle sie mit dem Lichtstrahl ein. Zwischen Mondlicht, Radar, Farm-Drohnen, Synth-Musik und Sci-Fi-Sounds geht es darum, alle Ziele moeglichst elegant einzusammeln.

![UFO Cow Hunt](https://img.shields.io/badge/Three.js-3D%20Browsergame-79fff0)
![Vite](https://img.shields.io/badge/Vite-dev%20server-fff2a5)

## Spielen

[UFO Cow Hunt auf GitHub Pages spielen](https://ddave82.github.io/Ufo-Cow-Hunt/)

## Gameplay

Du steuerst ein UFO durch eine naechtliche Landschaft. Kuehe geben Punkte, ein seltener betrunkener Bonus-Mensch gibt Extra-Punkte, Energiekristalle laden den Beam wieder auf. Farm-Drohnen sind keine Instant-Death-Gegner, aber sie loesen Alarm aus und ziehen Beam-Energie.

Wenn alles eingesammelt ist, endet die Runde: Das UFO startet in den Himmel, der Takeoff-Sound laeuft und deine Zeit plus Punkte werden angezeigt.

## Features

- 3D-Landschaft mit Terrain, Wasser, Baeumen, Felsen, Wolken, Sternenhimmel und Mondlicht
- UFO mit Metall-Details, Nieten, Glaskuppel und angedeutetem Alien
- Lichtstrahl zum Einsammeln von Kuehen und Bonus-Zielen
- Rotierendes Radar mit Zielen, Drohnen und Weltgrenze
- Punktesystem mit Combo-Multiplikator
- Beam-Energie, Boost und Energiekristalle
- Farm-Drohnen mit Alarm- und Energie-Drain
- Startmenue, Settings-Menue und Endscreen mit Restart
- Getrennte Lautstaerke fuer UFO/Effekte und Musik
- Musik-Playlist mit `music_1.mp3` und `music_2.mp3`
- Atmosphaeren-Sound, Beam-Sound, Takeoff-Sound und Feedback-Sounds

## Steuerung

| Taste | Aktion |
| --- | --- |
| `W` oder `Pfeil hoch` | Schub nach vorne |
| `A` / `D` oder `Pfeil links` / `Pfeil rechts` | UFO drehen |
| `S` oder `Pfeil runter` | Bremsen |
| `Leertaste` | Lichtstrahl aktivieren |
| `Shift` | Boost |
| `Esc` | Einstellungen oeffnen/schliessen |
| `M` | Sound stummschalten |

## Lokales Setup

Voraussetzungen:

- Node.js
- npm

Installation:

```bash
npm install
```

Dev-Server starten:

```bash
npm run dev
```

Dann im Browser oeffnen:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
```

Preview des Production-Builds:

```bash
npm run preview
```

## Sound-Dateien

Die Musik und Effekte liegen lokal im Ordner `sounds/` und werden beim Build von Vite als Assets gebuendelt.

- `music_1.mp3` und `music_2.mp3`: Musik-Playlist im Loop
- `atmo.mp3`: Atmosphaere, wird regelmaessig eingestreut
- `beam.mp3`: Beam-Sound beim Hochbeamen
- `takeoff.mp3`: Sound beim erfolgreichen Levelabschluss
- `countdown.mp3`: vorbereitet fuer eine spaetere Rundenzeit-/Countdown-Mechanik

## Tech Stack

- [Three.js](https://threejs.org/) fuer 3D-Rendering
- [Vite](https://vite.dev/) fuer Dev-Server und Build
- Web Audio API und HTML Audio fuer Synth-Sounds und MP3-Wiedergabe

## Status

Spielbarer Prototyp. Die naechste groessere Idee ist eine Rundenzeit mit Countdown, sobald eine gute Balance zwischen entspanntem Erkunden und mehr Action gefunden ist.
