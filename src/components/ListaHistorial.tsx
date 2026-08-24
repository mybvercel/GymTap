"use client";

import { useEffect, useMemo, useState } from "react";
import { leerHistorial } from "@/lib/almacen";
import { EJERCICIOS, buscarEjercicio } from "@/lib/catalogo";
import { GRUPOS, volumen, type GrupoMuscular, type Sesion } from "@/lib/dominio";

/**
 * Historial de entrenamientos guardados en este teléfono.
 *
 * El filtro por ejercicio y por grupo muscular vale más que uno por fecha:
 * la pregunta real no es "qué hice el martes" sino "cuánto levanté la última
 * vez en press de banca", que es lo que decide el peso de hoy.
 */
export function ListaHistorial() {
  const [sesiones, setSesiones] = useState<Sesion[] | null>(null);
  const [ejercicioId, setEjercicioId] = useState("");
  const [grupo, setGrupo] = useState<GrupoMuscular | "">("");

  useEffect(() => {
    leerHistorial().then(setSesiones);
  }, []);

  const filtradas = useMemo(() => {
    if (!sesiones) return [];
    return sesiones
      .map((s) => ({
        ...s,
        bloques: s.bloques.filter((b) => {
          if (ejercicioId && b.ejercicioId !== ejercicioId) return false;
          if (grupo && buscarEjercicio(b.ejercicioId)?.grupo !== grupo) return false;
          return true;
        }),
      }))
      .filter((s) => s.bloques.length > 0);
  }, [sesiones, ejercicioId, grupo]);

  if (!sesiones) return <p className="suave">Cargando…</p>;

  if (sesiones.length === 0) {
    return (
      <section className="panel">
        <p className="eyebrow">Todavía no hay nada</p>
        <p className="suave" style={{ margin: "0.5rem 0 0" }}>
          Cuando guardes tu primer entrenamiento va a aparecer acá. Todo se
          guarda en este teléfono: no hay cuenta ni servidor.
        </p>
      </section>
    );
  }

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <select
          className="secundaria"
          style={{ flex: 1 }}
          value={grupo}
          onChange={(e) => setGrupo(e.target.value as GrupoMuscular | "")}
          aria-label="Filtrar por grupo muscular"
        >
          <option value="">Todos los grupos</option>
          {Object.entries(GRUPOS).map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </select>
        <select
          className="secundaria"
          style={{ flex: 1 }}
          value={ejercicioId}
          onChange={(e) => setEjercicioId(e.target.value)}
          aria-label="Filtrar por ejercicio"
        >
          <option value="">Todos los ejercicios</option>
          {EJERCICIOS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </div>

      {filtradas.length === 0 && <p className="suave">Nada con ese filtro.</p>}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {filtradas.map((s) => (
          <article key={s.id} className="panel">
            <p className="eyebrow">{fecha(s.inicio)}</p>
            {s.bloques.map((b) => {
              const mejor = b.series.reduce((m, x) => Math.max(m, x.peso), 0);
              const maxReps = b.series.reduce((m, x) => Math.max(m, x.reps), 0);
              return (
                <div key={`${b.estacionId}-${b.inicio}`} style={{ marginTop: "0.75rem" }}>
                  <div className="fila" style={{ borderBottom: 0, paddingBottom: "0.25rem" }}>
                    <strong>{buscarEjercicio(b.ejercicioId)?.nombre ?? b.ejercicioId}</strong>
                    <span className="suave">{b.series.length === 1 ? "1 serie" : `${b.series.length} series`}</span>
                  </div>
                  <p className="suave" style={{ margin: 0, fontSize: "0.875rem" }}>
                    Mejor carga {mejor} · máximo {maxReps} reps · volumen{" "}
                    {volumen(b.series).toLocaleString("es-AR")}
                  </p>
                  {b.nota && (
                    <p className="suave" style={{ margin: "0.375rem 0 0", fontSize: "0.875rem" }}>
                      {b.nota}
                    </p>
                  )}
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </>
  );
}

function fecha(ts: number): string {
  return new Date(ts).toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
