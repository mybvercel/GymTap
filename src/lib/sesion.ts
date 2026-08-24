import type { Serie, Sesion, Unidad } from "./dominio";

/**
 * Las reglas. Funciones puras: reciben una sesión y devuelven otra. Persistir
 * es problema de `almacen.ts`, y así esto se prueba sin navegador.
 */

/**
 * Ventana anti doble lectura.
 *
 * Un NFC dispara la lectura apenas el teléfono se acerca, y es facilísimo que
 * lo lea dos veces en el mismo gesto. Sin esta ventana, apoyar el celular
 * registraría dos series. Cuatro segundos filtra el rebote sin molestar:
 * nadie hace dos series en cuatro segundos.
 */
export const VENTANA_ANTI_REBOTE_MS = 4000;

export function nuevaSesion(seriesTotales: number, ahora = Date.now()): Sesion {
  return { id: crypto.randomUUID(), inicio: ahora, seriesTotales, series: [] };
}

/** Qué pasó al pasar el teléfono. La pantalla decide qué mostrar con esto. */
export type Lectura =
  | { tipo: "serie-registrada"; sesion: Sesion; serie: Serie }
  | { tipo: "rebote"; sesion: Sesion };

/**
 * El corazón de la app: pasar el teléfono por el chip.
 *
 * Cada lectura registra una serie. No hay pantalla previa ni confirmación: el
 * gesto es "hice la serie, paso el celular", y eso es todo.
 */
export function leerEtiqueta(
  sesionPrevia: Sesion | null,
  carga: { peso: number; reps: number; unidad: Unidad; seriesTotales: number },
  ahora = Date.now(),
  ventana = VENTANA_ANTI_REBOTE_MS,
): Lectura {
  const sesion: Sesion = sesionPrevia ?? nuevaSesion(carga.seriesTotales, ahora);
  const ultima = sesion.series[sesion.series.length - 1];

  if (ultima && ahora - ultima.ts < ventana) {
    return { tipo: "rebote", sesion };
  }

  const serie: Serie = {
    n: sesion.series.length + 1,
    peso: carga.peso,
    reps: carga.reps,
    unidad: carga.unidad,
    ts: ahora,
    // El descanso no se pide: se mide. Es el tiempo real entre series.
    descansoPrevio: ultima ? Math.round((ahora - ultima.ts) / 1000) : undefined,
  };

  return {
    tipo: "serie-registrada",
    sesion: { ...sesion, series: [...sesion.series, serie] },
    serie,
  };
}

/** Corrige una serie ya registrada, sin tocarle la hora. */
export function corregirSerie(
  sesion: Sesion,
  n: number,
  cambios: Partial<Pick<Serie, "peso" | "reps">>,
): Sesion {
  return { ...sesion, series: sesion.series.map((s) => (s.n === n ? { ...s, ...cambios } : s)) };
}

/** Borra la última serie y renumera, para que no queden huecos. */
export function borrarUltimaSerie(sesion: Sesion): Sesion {
  return { ...sesion, series: sesion.series.slice(0, -1).map((s, i) => ({ ...s, n: i + 1 })) };
}
