"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { archivarSesion, leerSesionActiva, guardarSesionActiva } from "@/lib/almacen";
import { limpiarBloquesVacios, duracionMinutos } from "@/lib/sesion";
import { buscarEjercicio } from "@/lib/catalogo";
import { volumen, type Sesion } from "@/lib/dominio";

/**
 * El entrenamiento en curso, si hay uno.
 *
 * Existe porque una sesión puede quedar abierta: la persona cierra la pestaña,
 * se le apaga el teléfono o se va del gimnasio sin tocar nada. Al volver, lo
 * que hizo sigue acá y puede cerrarlo o seguir.
 */
export function ResumenSesion() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    leerSesionActiva().then((s) => {
      setSesion(s);
      setCargando(false);
    });
  }, []);

  async function guardar() {
    if (!sesion) return;
    const limpia = limpiarBloquesVacios(sesion);
    if (limpia.bloques.length === 0) {
      // Una sesión sin ninguna serie no es un entrenamiento: se descarta.
      await guardarSesionActiva(limpia);
      await archivarSesion({ ...limpia, bloques: [] });
    } else {
      await archivarSesion(limpia);
    }
    setSesion(null);
  }

  if (cargando) return null;

  if (!sesion || sesion.bloques.length === 0) {
    return (
      <section className="panel">
        <p className="eyebrow">Sin entrenamiento abierto</p>
        <p className="suave" style={{ margin: "0.5rem 0 0" }}>
          Tocá una etiqueta y arranca solo.
        </p>
      </section>
    );
  }

  // Tocar una etiqueta y alejarse deja un bloque sin series. No es un
  // ejercicio: no se cuenta ni se muestra, salvo que sea el que está abierto.
  const visibles = sesion.bloques.filter((b) => b.series.length > 0 || !b.cerrado);
  const series = visibles.reduce((n, b) => n + b.series.length, 0);
  const total = visibles.reduce((n, b) => n + volumen(b.series), 0);

  return (
    <section className="panel">
      <p className="eyebrow">Entrenando ahora</p>

      <div style={{ display: "flex", gap: "1.5rem", margin: "0.75rem 0 1rem" }}>
        <Dato valor={String(visibles.length)} etiqueta="ejercicios" />
        <Dato valor={String(series)} etiqueta="series" />
        <Dato valor={`${duracionMinutos(sesion)}′`} etiqueta="tiempo" />
      </div>

      {visibles.map((b) => (
        <div key={`${b.estacionId}-${b.inicio}`} className="fila">
          <span>
            <strong>{buscarEjercicio(b.ejercicioId)?.nombre ?? b.ejercicioId}</strong>
            {!b.cerrado && <span className="chip" style={{ marginLeft: "0.5rem" }}>en curso</span>}
          </span>
          <span className="suave">{b.series.length === 1 ? "1 serie" : `${b.series.length} series`}</span>
        </div>
      ))}

      <p className="suave" style={{ margin: "0.75rem 0 1rem", fontSize: "0.875rem" }}>
        Volumen total: {total.toLocaleString("es-AR")}
      </p>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        {visibles.find((b) => !b.cerrado) && (
          <Link
            href={`/e/${visibles.find((b) => !b.cerrado)!.estacionId}`}
            className="secundaria"
            style={{ flex: 1, display: "grid", placeContent: "center", textDecoration: "none" }}
          >
            Seguir
          </Link>
        )}
        <button type="button" className="accion" style={{ flex: 1, minHeight: 56 }} onClick={guardar}>
          Guardar entrenamiento
        </button>
      </div>
    </section>
  );
}

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, lineHeight: 1 }}>{valor}</p>
      <p className="eyebrow" style={{ margin: "0.25rem 0 0" }}>
        {etiqueta}
      </p>
    </div>
  );
}
