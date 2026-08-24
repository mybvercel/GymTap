/**
 * Modelo del dominio.
 *
 * Dos mundos separados a propósito:
 *
 * - El CATÁLOGO (ejercicios y estaciones) lo define el gimnasio. Hoy vive en
 *   código porque es un prototipo, pero se lee siempre a través de las
 *   funciones de `catalogo.ts`, así el día que pase a una API no hay que tocar
 *   la interfaz.
 *
 * - El HISTORIAL (sesiones y series) es del dispositivo. No hay cuentas: cada
 *   teléfono guarda lo suyo en IndexedDB. Eso es lo que hace que registrar una
 *   serie sea instantáneo y funcione sin señal, que es la condición real de un
 *   gimnasio.
 */

export type GrupoMuscular =
  | "pecho"
  | "espalda"
  | "hombros"
  | "brazos"
  | "piernas"
  | "gluteos"
  | "core"
  | "cardio"
  | "cuerpo-completo";

export const GRUPOS: Record<GrupoMuscular, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  brazos: "Brazos",
  piernas: "Piernas",
  gluteos: "Glúteos",
  core: "Core",
  cardio: "Cardio",
  "cuerpo-completo": "Cuerpo completo",
};

export type Unidad = "kg" | "lb";

/** Lo que se hace. Un ejercicio puede realizarse en varias estaciones. */
export interface Ejercicio {
  id: string;
  nombre: string;
  grupo: GrupoMuscular;
  equipo: string;
  instrucciones: string[];
  /** Cuántas series propone el gimnasio, como punto de partida. */
  seriesSugeridas: number;
  /** Rango objetivo, en texto porque no siempre es un número exacto. */
  repsObjetivo: string;
  descansoSegundos: number;
  imagen?: string;
}

/**
 * La máquina física, con su etiqueta pegada.
 *
 * Es una entidad aparte del ejercicio y no un detalle: un banco plano sirve
 * para varios ejercicios, y un gimnasio puede tener tres poleas idénticas.
 * Cada etiqueta apunta a UNA estación, y la estación decide qué ejercicio abre.
 */
export interface Estacion {
  /** Va en la URL de la etiqueta: /e/<id>. Corto, porque se escribe en el NFC. */
  id: string;
  nombre: string;
  ejercicioId: string;
  ubicacion?: string;
  activa: boolean;
}

/** Una serie registrada. Es la unidad mínima del sistema. */
export interface Serie {
  n: number;
  peso: number;
  reps: number;
  unidad: Unidad;
  /** Momento en que se registró, para calcular descansos reales. */
  ts: number;
  /** Segundos que descansó ANTES de esta serie. Se calcula solo. */
  descansoPrevio?: number;
  nota?: string;
}

/** Un ejercicio dentro de una sesión, con las series que se hicieron. */
export interface BloqueEjercicio {
  ejercicioId: string;
  estacionId: string;
  inicio: number;
  series: Serie[];
  nota?: string;
  cerrado: boolean;
}

/** Un entrenamiento: lo que hiciste en una visita al gimnasio. */
export interface Sesion {
  id: string;
  inicio: number;
  fin?: number;
  bloques: BloqueEjercicio[];
}

/** Preferencias del dispositivo. No hay cuenta, así que viven acá. */
export interface Ajustes {
  unidad: Unidad;
  sonido: boolean;
  vibracion: boolean;
  /** Descanso por defecto cuando el ejercicio no define uno. */
  descansoPorDefecto: number;
}

export const AJUSTES_INICIALES: Ajustes = {
  unidad: "kg",
  sonido: true,
  vibracion: true,
  descansoPorDefecto: 60,
};

/** Opciones de descanso que ofrece la pantalla del temporizador. */
export const DESCANSOS = [30, 60, 90, 120, 180] as const;

/** Volumen de un bloque: peso por repeticiones, sumado serie a serie. */
export function volumen(series: Serie[]): number {
  return series.reduce((total, s) => total + s.peso * s.reps, 0);
}

/** La última serie registrada, que es de donde sale la carga sugerida. */
export function ultimaSerie(bloque: BloqueEjercicio): Serie | undefined {
  return bloque.series[bloque.series.length - 1];
}
