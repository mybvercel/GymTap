"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Ajustes, Ejercicio, Estacion, Sesion } from "@/lib/dominio";
import { GRUPOS, volumen } from "@/lib/dominio";
import {
  guardarAjustes,
  guardarSesionActiva,
  leerAjustes,
  leerSesionActiva,
  ultimaCarga,
} from "@/lib/almacen";
import { bloqueDe, borrarUltimaSerie, cerrarBloque, leerEtiqueta } from "@/lib/sesion";
import { Descanso } from "./Descanso";

interface Props {
  estacion: Estacion;
  ejercicio: Ejercicio;
}

/**
 * La pantalla que abre la etiqueta NFC o el QR.
 *
 * Todo el trabajo ocurre al montar: se lee la sesión guardada y se decide si
 * esta lectura abre el ejercicio o registra una serie. La persona no elige
 * nada; el gesto de acercar el teléfono ya es la decisión.
 */
export function PantallaEstacion({ estacion, ejercicio }: Props) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [ajustes, setAjustes] = useState<Ajustes | null>(null);
  const [peso, setPeso] = useState(0);
  const [reps, setReps] = useState(10);
  const [descansando, setDescansando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const yaProceso = useRef(false);

  const mostrarAviso = useCallback((texto: string) => {
    setAviso(texto);
    setTimeout(() => setAviso(null), 2200);
  }, []);

  // Se corre una sola vez por carga de página: cada lectura del NFC es una
  // navegación nueva, y es justamente eso lo que cuenta como "tap".
  useEffect(() => {
    if (yaProceso.current) return;
    yaProceso.current = true;

    (async () => {
      const [previa, prefs] = await Promise.all([leerSesionActiva(), leerAjustes()]);
      const sugerida = await ultimaCarga(ejercicio.id, previa);
      const carga = {
        peso: sugerida?.peso ?? 0,
        reps: sugerida?.reps ?? repsIniciales(ejercicio.repsObjetivo),
        unidad: prefs.unidad,
      };

      const lectura = leerEtiqueta(previa, estacion.id, ejercicio.id, carga);
      setAjustes(prefs);
      setPeso(carga.peso);
      setReps(carga.reps);
      setSesion(lectura.sesion);
      await guardarSesionActiva(lectura.sesion);

      if (lectura.tipo === "serie-registrada") {
        mostrarAviso(`Serie ${lectura.serie.n} registrada`);
        setDescansando(true);
      }
    })();
  }, [estacion.id, ejercicio.id, ejercicio.repsObjetivo, mostrarAviso]);

  async function registrar() {
    if (!sesion || !ajustes) return;
    const lectura = leerEtiqueta(sesion, estacion.id, ejercicio.id, {
      peso,
      reps,
      unidad: ajustes.unidad,
    });
    if (lectura.tipo === "rebote") return;
    setSesion(lectura.sesion);
    await guardarSesionActiva(lectura.sesion);
    if (lectura.tipo === "serie-registrada") {
      mostrarAviso(`Serie ${lectura.serie.n} registrada`);
      setDescansando(true);
    }
  }

  async function deshacer() {
    if (!sesion) return;
    const actualizada = borrarUltimaSerie(sesion, estacion.id);
    setSesion(actualizada);
    await guardarSesionActiva(actualizada);
    setDescansando(false);
    mostrarAviso("Serie borrada");
  }

  async function terminar() {
    if (!sesion) return;
    const actualizada = cerrarBloque(sesion, estacion.id);
    setSesion(actualizada);
    await guardarSesionActiva(actualizada);
  }

  async function cambiarDescansoPreferido(seg: number) {
    if (!ajustes) return;
    const nuevos = { ...ajustes, descansoPorDefecto: seg };
    setAjustes(nuevos);
    await guardarAjustes(nuevos);
  }

  const bloque = sesion ? bloqueDe(sesion, estacion.id) : undefined;
  const hechas = bloque?.series.length ?? 0;
  const totales = Math.max(ejercicio.seriesSugeridas, hechas);
  const cargando = !sesion || !ajustes;

  if (cargando) {
    return (
      <main className="marco">
        <p className="suave">Abriendo {ejercicio.nombre}…</p>
      </main>
    );
  }

  if (descansando) {
    return (
      <main className="marco">
        <header style={{ marginBottom: "1rem" }}>
          <p className="eyebrow">{estacion.nombre}</p>
          <h1 className="titulo">{ejercicio.nombre}</h1>
          <p className="suave" style={{ margin: "0.25rem 0 0" }}>
            Serie {hechas} de {totales} lista
          </p>
        </header>

        <Descanso
          segundos={ejercicio.descansoSegundos || ajustes.descansoPorDefecto}
          sonido={ajustes.sonido}
          vibracion={ajustes.vibracion}
          onTerminar={() => setDescansando(false)}
          onCambiarPreferido={cambiarDescansoPreferido}
        />

        <button
          type="button"
          className="secundaria"
          style={{ marginTop: "0.75rem" }}
          onClick={deshacer}
        >
          Borrar la serie que acabo de registrar
        </button>

        {aviso && <p className="aviso">{aviso}</p>}
      </main>
    );
  }

  return (
    <main className="marco">
      <header>
        <p className="eyebrow">
          {estacion.nombre} · {GRUPOS[ejercicio.grupo]}
        </p>
        <h1 className="titulo">{ejercicio.nombre}</h1>
      </header>

      <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <p className="eyebrow" style={{ margin: 0 }}>
              Serie {hechas + 1} de {totales}
            </p>
            <p className="suave" style={{ margin: 0, fontSize: "0.875rem" }}>
              objetivo {ejercicio.repsObjetivo} reps
            </p>
          </div>

          <div className="serie-puntos" style={{ margin: "0.75rem 0 1rem" }}>
            {Array.from({ length: totales }, (_, i) => (
              <span key={i} className="punto" data-hecha={i < hechas} />
            ))}
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            <Selector
              etiqueta={ajustes.unidad}
              valor={peso}
              paso={2.5}
              min={0}
              onCambio={setPeso}
            />
            <Selector etiqueta="reps" valor={reps} paso={1} min={1} onCambio={setReps} />
          </div>
        </div>

        <button type="button" className="accion" onClick={registrar}>
          Registrar serie {hechas + 1}
        </button>

        {hechas > 0 && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="secundaria" style={{ flex: 1 }} onClick={deshacer}>
              Borrar última
            </button>
            <button type="button" className="secundaria" style={{ flex: 1 }} onClick={terminar}>
              Terminar ejercicio
            </button>
          </div>
        )}

        {hechas > 0 && bloque && (
          <section className="panel">
            <p className="eyebrow">Lo que llevás</p>
            {bloque.series.map((s) => (
              <div key={s.n} className="fila">
                <span style={{ fontWeight: 700 }}>Serie {s.n}</span>
                <span className="suave">
                  {s.peso} {s.unidad} × {s.reps}
                  {s.descansoPrevio ? ` · descanso ${s.descansoPrevio}s` : ""}
                </span>
              </div>
            ))}
            <p className="suave" style={{ margin: "0.75rem 0 0", fontSize: "0.875rem" }}>
              Volumen: {volumen(bloque.series).toLocaleString("es-AR")} {ajustes.unidad}
            </p>
          </section>
        )}

        <section className="panel">
          <p className="eyebrow">Cómo se hace</p>
          <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }} className="suave">
            {ejercicio.instrucciones.map((i) => (
              <li key={i} style={{ marginBottom: "0.375rem" }}>
                {i}
              </li>
            ))}
          </ol>
        </section>

        <Link href="/" className="secundaria" style={{ display: "grid", placeContent: "center", textDecoration: "none" }}>
          Ver mi entrenamiento
        </Link>
      </div>

      {aviso && <p className="aviso">{aviso}</p>}
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

/** Del rango "8-12" sale 8: se arranca por abajo y se sube si sobra. */
function repsIniciales(objetivo: string): number {
  const n = Number(objetivo.split("-")[0]);
  return Number.isFinite(n) && n > 0 ? n : 10;
}
