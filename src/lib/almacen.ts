import { get, set, del } from "idb-keyval";
import { AJUSTES_INICIALES, type Ajustes, type Sesion } from "./dominio";

/**
 * Persistencia en el dispositivo.
 *
 * IndexedDB y no localStorage porque el historial crece sin techo y porque
 * escribir no bloquea el hilo principal: registrar una serie no puede trabar
 * la pantalla justo cuando la persona está apurada entre series.
 *
 * No hay cuentas ni servidor. Todo lo que se guarda acá es de este teléfono.
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

/** Cierra la sesión activa y la manda al historial, más reciente primero. */
export async function archivarSesion(sesion: Sesion): Promise<void> {
  const historial = await leerHistorial();
  const cerrada: Sesion = { ...sesion, fin: sesion.fin ?? Date.now() };
  await set(CLAVE_HISTORIAL, [cerrada, ...historial]);
  await borrarSesionActiva();
}

export async function leerAjustes(): Promise<Ajustes> {
  const guardados = await get<Partial<Ajustes>>(CLAVE_AJUSTES);
  // Se mezcla con los valores iniciales para que agregar un ajuste nuevo no
  // rompa a quien ya tenía datos guardados.
  return { ...AJUSTES_INICIALES, ...guardados };
}

export async function guardarAjustes(ajustes: Ajustes): Promise<void> {
  await set(CLAVE_AJUSTES, ajustes);
}

/**
 * Última carga usada en un ejercicio, mirando primero la sesión en curso y
 * después el historial. Es lo que hace que el segundo día no haya que volver
 * a cargar el peso a mano.
 */
export async function ultimaCarga(
  ejercicioId: string,
  activa: Sesion | null,
): Promise<{ peso: number; reps: number } | null> {
  const buscarEn = (sesiones: Sesion[]) => {
    for (const sesion of sesiones) {
      for (const bloque of [...sesion.bloques].reverse()) {
        if (bloque.ejercicioId !== ejercicioId) continue;
        const ultima = bloque.series[bloque.series.length - 1];
        if (ultima) return { peso: ultima.peso, reps: ultima.reps };
      }
    }
    return null;
  };

  if (activa) {
    const enCurso = buscarEn([activa]);
    if (enCurso) return enCurso;
  }
  return buscarEn(await leerHistorial());
}
