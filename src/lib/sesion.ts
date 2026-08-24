import type { BloqueEjercicio, Serie, Sesion, Unidad } from "./dominio";

/**
 * Reglas del entrenamiento. Funciones puras: reciben una sesión y devuelven
 * otra. Persistir es problema de `almacen.ts`, y así estas reglas se pueden
 * probar sin navegador ni base de datos.
 */

/**
 * Ventana anti doble lectura.
 *
 * Un NFC dispara la lectura apenas el teléfono se acerca, y es facilísimo que
 * lo lea dos veces en el mismo gesto. Sin esta ventana, apoyar el celular
 * registraría dos series. Cuatro segundos alcanza para filtrar el rebote y no
 * llega a molestar: nadie hace dos series en cuatro segundos.
 */
export const VENTANA_ANTI_REBOTE_MS = 4000;

export function nuevaSesion(): Sesion {
  return { id: crypto.randomUUID(), inicio: Date.now(), bloques: [] };
}

export function bloqueAbierto(sesion: Sesion): BloqueEjercicio | undefined {
  return sesion.bloques.find((b) => !b.cerrado);
}

export function bloqueDe(sesion: Sesion, estacionId: string): BloqueEjercicio | undefined {
  return sesion.bloques.find((b) => b.estacionId === estacionId && !b.cerrado);
}

/**
 * Qué pasó al leer una etiqueta. La pantalla decide qué mostrar a partir de
 * esto, y no al revés.
 */
export type Lectura =
  | { tipo: "abierto"; sesion: Sesion }
  | { tipo: "serie-registrada"; sesion: Sesion; serie: Serie }
  | { tipo: "rebote"; sesion: Sesion };

/**
 * El corazón de la app: acercar el teléfono a la etiqueta.
 *
 * La primera lectura en una estación abre el ejercicio y no registra nada,
 * porque la persona recién llega a la máquina y todavía no levantó. Cada
 * lectura posterior registra una serie: ese es el gesto que reemplaza a
 * escribir en un formulario.
 */
export function leerEtiqueta(
  sesionPrevia: Sesion | null,
  estacionId: string,
  ejercicioId: string,
  carga: { peso: number; reps: number; unidad: Unidad },
  ahora = Date.now(),
): Lectura {
  const sesion: Sesion = sesionPrevia ?? { id: crypto.randomUUID(), inicio: ahora, bloques: [] };
  const abierto = bloqueDe(sesion, estacionId);

  // Primera lectura en esta estación: se abre el ejercicio y se cierra el
  // anterior, porque la persona se movió de máquina.
  if (!abierto) {
    const bloques = sesion.bloques.map((b) => (b.cerrado ? b : { ...b, cerrado: true }));
    const nuevo: BloqueEjercicio = {
      ejercicioId,
      estacionId,
      inicio: ahora,
      series: [],
      cerrado: false,
    };
    return { tipo: "abierto", sesion: { ...sesion, bloques: [...bloques, nuevo] } };
  }

  const ultima = abierto.series[abierto.series.length - 1];
  const referencia = ultima?.ts ?? abierto.inicio;
  if (ahora - referencia < VENTANA_ANTI_REBOTE_MS) {
    return { tipo: "rebote", sesion };
  }

  const serie: Serie = {
    n: abierto.series.length + 1,
    peso: carga.peso,
    reps: carga.reps,
    unidad: carga.unidad,
    ts: ahora,
    // El descanso no se pide: se mide. Es el tiempo real entre series.
    descansoPrevio: ultima ? Math.round((ahora - ultima.ts) / 1000) : undefined,
  };

  const bloques = sesion.bloques.map((b) =>
    b === abierto ? { ...b, series: [...b.series, serie] } : b,
  );
  return { tipo: "serie-registrada", sesion: { ...sesion, bloques }, serie };
}

/** Corrige una serie ya registrada, sin tocar su marca de tiempo. */
export function corregirSerie(
  sesion: Sesion,
  estacionId: string,
  n: number,
  cambios: Partial<Pick<Serie, "peso" | "reps" | "nota">>,
): Sesion {
  const bloques = sesion.bloques.map((b) => {
    if (b.estacionId !== estacionId || b.cerrado) return b;
    return { ...b, series: b.series.map((s) => (s.n === n ? { ...s, ...cambios } : s)) };
  });
  return { ...sesion, bloques };
}

/** Borra la última serie del bloque y renumera, para que no queden huecos. */
export function borrarUltimaSerie(sesion: Sesion, estacionId: string): Sesion {
  const bloques = sesion.bloques.map((b) => {
    if (b.estacionId !== estacionId || b.cerrado) return b;
    const series = b.series.slice(0, -1).map((s, i) => ({ ...s, n: i + 1 }));
    return { ...b, series };
  });
  return { ...sesion, bloques };
}

export function cerrarBloque(sesion: Sesion, estacionId: string, nota?: string): Sesion {
  const bloques = sesion.bloques.map((b) =>
    b.estacionId === estacionId && !b.cerrado ? { ...b, cerrado: true, nota: nota ?? b.nota } : b,
  );
  return { ...sesion, bloques };
}

/** Series sueltas sin ninguna registrada no valen la pena guardarlas. */
export function limpiarBloquesVacios(sesion: Sesion): Sesion {
  return { ...sesion, bloques: sesion.bloques.filter((b) => b.series.length > 0) };
}

export function duracionMinutos(sesion: Sesion): number {
  return Math.max(1, Math.round(((sesion.fin ?? Date.now()) - sesion.inicio) / 60000));
}
