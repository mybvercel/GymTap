import { get, set, del } from "idb-keyval";
import { AJUSTES_INICIALES, type Ajustes, type Sesion } from "./dominio";

/**
 * Persistencia en el dispositivo.
 *
 * IndexedDB y no localStorage porque escribir no bloquea el hilo principal:
 * registrar una serie no puede trabar la pantalla justo cuando la persona está
 * apurada entre series.
 */

const CLAVE_ACTIVA = "gymtap:sesion-activa";
const CLAVE_HISTORIAL = "gymtap:historial";
const CLAVE_AJUSTES = "gymtap:ajustes";

export async function leerSesionActiva(): Promise<Sesion | null> {
  return (await get<Sesion>(CLAVE_ACTIVA)) ?? null;
}

export async function guardarSesionActiva(sesion: Sesion): Promise<void> {
  await set(CLAVE_ACTIVA, sesion);
}

export async function borrarSesionActiva(): Promise<void> {
  await del(CLAVE_ACTIVA);
}

export async function leerHistorial(): Promise<Sesion[]> {
  return (await get<Sesion[]>(CLAVE_HISTORIAL)) ?? [];
}

/** Cierra la tanda y la manda al historial, más reciente primero. */
export async function archivarSesion(sesion: Sesion): Promise<void> {
  if (sesion.series.length > 0) {
    const historial = await leerHistorial();
    await set(CLAVE_HISTORIAL, [{ ...sesion, fin: sesion.fin ?? Date.now() }, ...historial]);
  }
  await borrarSesionActiva();
}

export async function leerAjustes(): Promise<Ajustes> {
  const guardados = await get<Partial<Ajustes>>(CLAVE_AJUSTES);
  // Se mezcla con los iniciales para que sumar un ajuste no rompa lo guardado.
  return { ...AJUSTES_INICIALES, ...guardados };
}

export async function guardarAjustes(ajustes: Ajustes): Promise<void> {
  await set(CLAVE_AJUSTES, ajustes);
}

/** Última carga usada, para no tener que cargar el peso otra vez. */
export async function ultimaCarga(): Promise<{ peso: number; reps: number } | null> {
  const historial = await leerHistorial();
  for (const sesion of historial) {
    const ultima = sesion.series[sesion.series.length - 1];
    if (ultima) return { peso: ultima.peso, reps: ultima.reps };
  }
  return null;
}
