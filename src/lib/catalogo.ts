import type { Ejercicio, Estacion } from "./dominio";

/**
 * El catálogo del gimnasio.
 *
 * Vive en código porque es un prototipo y así no hay backend que mantener ni
 * señal de la que depender. Todo el resto de la app lo consulta por las
 * funciones de abajo, nunca tocando los arrays: el día que esto salga de una
 * API, cambia este archivo y nada más.
 */

export const EJERCICIOS: Ejercicio[] = [
  {
    id: "press-banca",
    nombre: "Press de banca",
    grupo: "pecho",
    equipo: "Barra",
    instrucciones: [
      "Apoyá los pies firmes en el piso y la espalda en el banco.",
      "Bajá la barra al pecho controlando, sin rebotar.",
      "Empujá hasta estirar los codos sin bloquearlos de golpe.",
    ],
    seriesSugeridas: 4,
    repsObjetivo: "8-12",
    descansoSegundos: 90,
  },
  {
    id: "sentadilla",
    nombre: "Sentadilla",
    grupo: "piernas",
    equipo: "Barra",
    instrucciones: [
      "Barra apoyada en los trapecios, no en el cuello.",
      "Bajá como si te sentaras, rodillas en línea con los pies.",
      "Subí empujando con los talones.",
    ],
    seriesSugeridas: 4,
    repsObjetivo: "6-10",
    descansoSegundos: 120,
  },
  {
    id: "remo-polea",
    nombre: "Remo en polea baja",
    grupo: "espalda",
    equipo: "Polea",
    instrucciones: [
      "Espalda recta, pecho afuera.",
      "Tirá con los codos pegados al cuerpo.",
      "Volvé despacio, sin dejar que el peso te lleve.",
    ],
    seriesSugeridas: 3,
    repsObjetivo: "10-12",
    descansoSegundos: 60,
  },
  {
    id: "press-militar",
    nombre: "Press militar",
    grupo: "hombros",
    equipo: "Barra",
    instrucciones: [
      "Codos levemente adelante, no abiertos del todo.",
      "Empujá sobre la cabeza sin arquear la espalda.",
      "Bajá hasta el mentón con control.",
    ],
    seriesSugeridas: 3,
    repsObjetivo: "8-10",
    descansoSegundos: 90,
  },
  {
    id: "curl-biceps",
    nombre: "Curl de bíceps",
    grupo: "brazos",
    equipo: "Mancuernas",
    instrucciones: [
      "Codos quietos al costado del cuerpo.",
      "Subí sin balancear el torso.",
      "Bajá contando dos segundos.",
    ],
    seriesSugeridas: 3,
    repsObjetivo: "10-15",
    descansoSegundos: 60,
  },
  {
    id: "prensa",
    nombre: "Prensa de piernas",
    grupo: "piernas",
    equipo: "Máquina",
    instrucciones: [
      "Pies al ancho de los hombros en la plataforma.",
      "Bajá hasta que las rodillas hagan unos 90 grados.",
      "No estires del todo las rodillas arriba.",
    ],
    seriesSugeridas: 4,
    repsObjetivo: "10-15",
    descansoSegundos: 90,
  },
];

/**
 * Las estaciones son las etiquetas físicas. El id es corto porque se escribe
 * en el NFC y aparece en la URL: dos poleas idénticas son dos estaciones
 * distintas apuntando al mismo ejercicio.
 */
export const ESTACIONES: Estacion[] = [
  { id: "banco-1", nombre: "Banco plano 1", ejercicioId: "press-banca", ubicacion: "Sala principal", activa: true },
  { id: "banco-2", nombre: "Banco plano 2", ejercicioId: "press-banca", ubicacion: "Sala principal", activa: true },
  { id: "jaula-1", nombre: "Jaula de sentadillas", ejercicioId: "sentadilla", ubicacion: "Sala de peso libre", activa: true },
  { id: "polea-1", nombre: "Polea baja 1", ejercicioId: "remo-polea", ubicacion: "Sala de máquinas", activa: true },
  { id: "polea-2", nombre: "Polea baja 2", ejercicioId: "remo-polea", ubicacion: "Sala de máquinas", activa: true },
  { id: "militar-1", nombre: "Rack de press militar", ejercicioId: "press-militar", ubicacion: "Sala de peso libre", activa: true },
  { id: "mancuernas-1", nombre: "Zona de mancuernas", ejercicioId: "curl-biceps", ubicacion: "Sala principal", activa: true },
  { id: "prensa-1", nombre: "Prensa 45 grados", ejercicioId: "prensa", ubicacion: "Sala de máquinas", activa: true },
];

export function buscarEjercicio(id: string): Ejercicio | undefined {
  return EJERCICIOS.find((e) => e.id === id);
}

export function buscarEstacion(id: string): Estacion | undefined {
  return ESTACIONES.find((e) => e.id === id);
}

/** Estación más ejercicio resueltos de una, que es como los usa la pantalla. */
export function resolverEstacion(id: string): { estacion: Estacion; ejercicio: Ejercicio } | null {
  const estacion = buscarEstacion(id);
  if (!estacion) return null;
  const ejercicio = buscarEjercicio(estacion.ejercicioId);
  if (!ejercicio) return null;
  return { estacion, ejercicio };
}

/** Todas las estaciones de un ejercicio: sirve para el panel y para los QR. */
export function estacionesDe(ejercicioId: string): Estacion[] {
  return ESTACIONES.filter((e) => e.ejercicioId === ejercicioId);
}
