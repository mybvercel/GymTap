"use client";

import { useEffect, useState } from "react";
import { leerHistorial } from "@/lib/almacen";
import { volumen, type Sesion } from "@/lib/dominio";

/** Tandas guardadas en este teléfono. */
export function ListaHistorial() {
  const [sesiones, setSesiones] = useState<Sesion[] | null>(null);

  useEffect(() => {
    leerHistorial().then(setSesiones);
  }, []);

  if (!sesiones) return <p className="suave">Cargando…</p>;

  if (sesiones.length === 0) {
    return (
      <section className="panel">
        <p className="eyebrow">Todavía no hay nada</p>
        <p className="suave chico">
          Cuando termines una tanda va a aparecer acá. Todo se guarda en este
          teléfono: no hay cuenta ni servidor.
        </p>
      </section>
    );
  }

  return (
    <div className="lista">
      {sesiones.map((s) => {
        const mejor = s.series.reduce((m, x) => Math.max(m, x.peso), 0);
        return (
          <article key={s.id} className="panel">
            <p className="eyebrow">{fecha(s.inicio)}</p>
            <div className="fila">
              <span className="fuerte">
                {s.series.length === 1 ? "1 serie" : `${s.series.length} series`}
              </span>
              <span className="suave">
                mejor {mejor} · volumen {volumen(s.series).toLocaleString("es-AR")}
              </span>
            </div>
          </article>
        );
      })}
    </div>
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
