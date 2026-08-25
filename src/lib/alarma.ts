/**
 * La alarma de fin de descanso.
 *
 * Se genera el sonido en el momento en vez de cargar un archivo: pesa cero y
 * suena igual sin conexión, que es la situación normal en un sótano con pesas.
 *
 * Lo importante es que los pitidos se **programan de antemano** contra el reloj
 * del motor de audio, no con un `setTimeout`. Cuando el teléfono se guarda en el
 * bolsillo, el navegador frena los temporizadores de JavaScript y una alarma
 * armada con `setTimeout` llegaría tarde o no llegaría. El motor de audio sigue
 * su propio reloj y dispara a horario.
 */

let ctx: AudioContext | null = null;
let sonando: OscillatorNode[] = [];

function contexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx ??= new Ctx();
  return ctx;
}

/**
 * Los navegadores no dejan sonar nada hasta que la persona tocó la pantalla al
 * menos una vez. Como el chip NFC abre la app sin ningún toque, esto se llama
 * en cualquier interacción para dejar el audio listo antes de necesitarlo.
 */
export function prepararAudio(): void {
  const c = contexto();
  if (c && c.state !== "running") void c.resume();
}

/** Si es `false`, el navegador todavía tiene el sonido bloqueado. */
export function audioListo(): boolean {
  return ctx?.state === "running";
}

/**
 * Dos ráfagas de tres pitidos. Un solo bip corto se pierde entre el ruido del
 * gimnasio y la música de los auriculares; esto se escucha aunque el teléfono
 * esté apoyado en el banco.
 */
const RAFAGA = [0, 0.24, 0.48, 1.0, 1.24, 1.48];

/** Programa la alarma para dentro de `enSegundos`. Reemplaza a la anterior. */
export function programarAlarma(enSegundos: number): void {
  cancelarAlarma();
  const c = contexto();
  if (!c) return;
  if (c.state !== "running") void c.resume();

  const base = c.currentTime + Math.max(0, enSegundos);
  for (const [i, offset] of RAFAGA.entries()) {
    sonando.push(pitido(c, base + offset, i % 3 === 2 ? 1245 : 933));
  }
}

/** Corta la alarma programada: cambió el descanso, o ya no hace falta. */
export function cancelarAlarma(): void {
  for (const osc of sonando) {
    try {
      osc.stop();
    } catch {
      /* Ya había terminado. */
    }
  }
  sonando = [];
}

function pitido(c: AudioContext, cuando: number, hz: number): OscillatorNode {
  const osc = c.createOscillator();
  const gan = c.createGain();
  // Onda cuadrada: corta mejor el ruido de fondo que una senoidal.
  osc.type = "square";
  osc.frequency.value = hz;
  // Se entra y se sale con una rampa para que no chasquee.
  gan.gain.setValueAtTime(0.0001, cuando);
  gan.gain.exponentialRampToValueAtTime(0.3, cuando + 0.012);
  gan.gain.setValueAtTime(0.3, cuando + 0.15);
  gan.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.2);
  osc.connect(gan).connect(c.destination);
  osc.start(cuando);
  osc.stop(cuando + 0.22);
  return osc;
}

/** Vibración larga, para cuando el sonido está en silencio o bloqueado. */
export function vibrarAlarma(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([400, 140, 400, 140, 600]);
  }
}
