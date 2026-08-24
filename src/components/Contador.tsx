"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Ajustes, Sesion } from "@/lib/dominio";
import { volumen } from "@/lib/dominio";
import {
  archivarSesion,
  guardarAjustes,
  guardarSesionActiva,
  leerAjustes,
  leerSesionActiva,
  ultimaCarga,
} from "@/lib/almacen";
import { borrarUltimaSerie, leerEtiqueta } from "@/lib/sesion";
import { Descanso } from "./Descanso";

/**
 * La pantalla única.
 *
 * Es el destino del chip NFC: abrir esta página YA cuenta como pasar el
 * teléfono, así que registra una serie y muestra el descanso. No hay nada que
 * tocar ni que confirmar.
 */
export function Contador() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [ajustes, setAjustes] = useState<Ajustes | null>(null);
  const [peso, setPeso] = useState(0);
  const [reps, setReps] = useState(10);
  const [descansando, setDescansando] = useState(false);
  const yaProceso = useRef(false);

  // Una sola vez por carga: cada lectura del NFC es una navegación nueva, y
  // eso es exactamente lo que cuenta como pasar el teléfono.
  useEffect(() => {
    if (yaProceso.current) return;
    yaProceso.current = true;

    (async () => {
      const [previa, prefs] = await Promise.all([leerSesionActiva(), leerAjustes()]);
      const sugerida = previa?.series.at(-1) ?? (await ultimaCarga());
      const carga = {
        peso: sugerida?.peso ?? 0,
        reps: sugerida?.reps ?? 10,
        unidad: prefs.unidad,
        seriesTotales: previa?.seriesTotales ?? prefs.seriesTotales,
      };

      const lectura = leerEtiqueta(previa, carga);
      setAjustes(prefs);
      setPeso(carga.peso);
      setReps(carga.reps);
      setSesion(lectura.sesion);
      await guardarSesionActiva(lectura.sesion);
      if (lectura.tipo === "serie-registrada") setDescansando(true);
    })();
  }, []);

  const actualizar = useCallback(async (nueva: Sesion) => {
    setSesion(nueva);
    await guardarSesionActiva(nueva);
  }, []);

  async function deshacer() {
    if (!sesion) return;
    await actualizar(borrarUltimaSerie(sesion));
    setDescansando(false);
  }

  async function terminar() {
    if (!sesion) return;
    await archivarSesion(sesion);
    setSesion(null);
    setDescansando(false);
  }

  async function cambiarTotales(delta: number) {
    if (!sesion || !ajustes) return;
    const seriesTotales = Math.max(1, sesion.seriesTotales + delta);
    await actualizar({ ...sesion, seriesTotales });
    const prefs = { ...ajustes, seriesTotales };
    setAjustes(prefs);
    await guardarAjustes(prefs);
  }

  if (!sesion || !ajustes) {
    return (
      <main className="marco centrado">
        <p className="suave">Registrando…</p>
      </main>
    );
  }

  // Terminada la tanda, la pantalla queda limpia hasta el próximo pase.
  if (sesion.series.length === 0) {
    return (
      <main className="marco centrado">
        <p className="eyebrow">Listo</p>
        <h1 className="titulo">Pasá el teléfono para empezar</h1>
        <p className="suave">Cada vez que lo pases queda registrada una serie.</p>
        <Link href="/historial" className="secundaria enlace">
          Ver historial
        </Link>
      </main>
    );
  }

  const hechas = sesion.series.length;
  const totales = Math.max(sesion.seriesTotales, hechas);

  return (
    <main className="marco">
      <section className="registro">
        <p className="eyebrow">Serie registrada</p>
        <p className="contador">
          {hechas}
          <span> de {totales}</span>
        </p>

        <div className="serie-puntos">
          {Array.from({ length: totales }, (_, i) => (
            <span key={i} className="punto" data-hecha={i < hechas} />
          ))}
        </div>

        <div className="ajuste-series">
          <button type="button" className="paso chico" onClick={() => cambiarTotales(-1)} aria-label="Menos series">
            −
          </button>
          <span className="suave">series objetivo</span>
          <button type="button" className="paso chico" onClick={() => cambiarTotales(1)} aria-label="Más series">
            +
          </button>
        </div>
      </section>

      {descansando ? (
        <Descanso
          segundos={ajustes.descansoSegundos}
          sonido={ajustes.sonido}
          vibracion={ajustes.vibracion}
          onTerminar={() => setDescansando(false)}
          onCambiarPreferido={async (s) => {
            const prefs = { ...ajustes, descansoSegundos: s };
            setAjustes(prefs);
            await guardarAjustes(prefs);
          }}
        />
      ) : (
        <section className="panel">
          <p className="eyebrow">Carga de la próxima serie</p>
          <div className="dos-columnas">
            <Selector etiqueta={ajustes.unidad} valor={peso} paso={2.5} min={0} onCambio={setPeso} />
            <Selector etiqueta="reps" valor={reps} paso={1} min={1} onCambio={setReps} />
          </div>
        </section>
      )}

      <section className="panel">
        <p className="eyebrow">Esta tanda</p>
        {sesion.series.map((s) => (
          <div key={s.n} className="fila">
            <span className="fuerte">Serie {s.n}</span>
            <span className="suave">
              {s.peso} {s.unidad} × {s.reps}
              {s.descansoPrevio ? ` · ${s.descansoPrevio}s` : ""}
            </span>
          </div>
        ))}
        <p className="suave chico">Volumen: {volumen(sesion.series).toLocaleString("es-AR")}</p>
      </section>

      <div className="acciones">
        <button type="button" className="secundaria" onClick={deshacer}>
          Borrar última
        </button>
        <button type="button" className="secundaria" onClick={terminar}>
          Terminar
        </button>
      </div>

      <Link href="/historial" className="secundaria enlace">
        Historial
      </Link>
    </main>
  );
}

/** Selector de a pasos: nadie escribe números con las manos transpiradas. */
function Selector({
  etiqueta,
  valor,
  paso,
  min,
  onCambio,
}: {
  etiqueta: string;
  valor: number;
  paso: number;
  min: number;
  onCambio: (v: number) => void;
}) {
  return (
    <div className="carga">
      <button
        type="button"
        className="paso"
        aria-label={`Bajar ${etiqueta}`}
        onClick={() => onCambio(Math.max(min, Math.round((valor - paso) * 100) / 100))}
      >
        −
      </button>
      <p className="valor">
        {valor}
        <span>{etiqueta}</span>
      </p>
      <button
        type="button"
        className="paso"
        aria-label={`Subir ${etiqueta}`}
        onClick={() => onCambio(Math.round((valor + paso) * 100) / 100)}
      >
        +
      </button>
    </div>
  );
}
