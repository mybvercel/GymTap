/**
 * Modelo del dominio.
 *
 * Hay UN solo link, el que se escribe en el chip NFC. Cada vez que el teléfono
 * lo lee se registra una serie. No hay catálogo de ejercicios ni de máquinas:
 * el contador es lo único que importa.
 *
 * Todo se guarda en el teléfono, en IndexedDB. Sin cuentas y sin servidor, así
 * registrar es instantáneo y funciona sin señal.
 */

export type Unidad = "kg" | "lb";

/** Una serie registrada. Es la unidad mínima del sistema. */
export interface Serie {
  n: number;
  peso: number;
  reps: number;
  unidad: Unidad;
  /** Momento en que se registró, para medir los descansos reales. */
  ts: number;
  /** Segundos descansados ANTES de esta serie. Se calcula solo. */
  descansoPrevio?: number;
}

/** El ejercicio en curso: una tanda de series. */
export interface Sesion {
  id: string;
  inicio: number;
  fin?: number;
  /** Cuántas series se piensa hacer. Solo sirve para mostrar "2 de 4". */
  seriesTotales: number;
  /** Nombre opcional, por si se quiere saber después qué fue esto. */
  nombre?: string;
  series: Serie[];
}

/** Preferencias del dispositivo. No hay cuenta, así que viven acá. */
export interface Ajustes {
  unidad: Unidad;
  sonido: boolean;
  vibracion: boolean;
  descansoSegundos: number;
  seriesTotales: number;
}

export const AJUSTES_INICIALES: Ajustes = {
  unidad: "kg",
  sonido: true,
  vibracion: true,
  descansoSegundos: 60,
  seriesTotales: 4,
};

/** Opciones de descanso que ofrece el temporizador. */
export const DESCANSOS = [30, 60, 90, 120, 180] as const;

/** Volumen: peso por repeticiones, sumado serie a serie. */
export function volumen(series: Serie[]): number {
  return series.reduce((total, s) => total + s.peso * s.reps, 0);
}

export function duracionMinutos(sesion: Sesion): number {
  return Math.max(1, Math.round(((sesion.fin ?? Date.now()) - sesion.inicio) / 60000));
}
