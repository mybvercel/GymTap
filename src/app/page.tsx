import Link from "next/link";
import { ESTACIONES, buscarEjercicio } from "@/lib/catalogo";
import { ResumenSesion } from "@/components/ResumenSesion";

/**
 * Pantalla de inicio.
 *
 * Es la que se ve cuando alguien abre la app sin haber tocado una etiqueta, y
 * el fallback obligatorio: el NFC puede no estar disponible, pero el QR y esta
 * lista siempre funcionan.
 */
export default function Inicio() {
  const estaciones = ESTACIONES.filter((e) => e.activa);

  return (
    <main className="marco">
      <header style={{ marginBottom: "1.25rem" }}>
        <p className="eyebrow">GymTap</p>
        <h1 className="titulo">Acercá el teléfono a la máquina</h1>
        <p className="suave" style={{ margin: "0.5rem 0 0" }}>
          Cada máquina tiene una etiqueta. La primera vez abre el ejercicio; después,
          cada vez que la tocás queda registrada una serie. Si tu teléfono no lee NFC,
          escaneá el código QR de la máquina.
        </p>
      </header>

      <ResumenSesion />

      <section style={{ marginTop: "1.25rem" }}>
        <p className="eyebrow">O elegí la máquina a mano</p>
        <div className="panel" style={{ marginTop: "0.5rem", padding: "0 1rem" }}>
          {estaciones.map((e) => {
            const ejercicio = buscarEjercicio(e.ejercicioId);
            return (
              <Link
                key={e.id}
                href={`/e/${e.id}`}
                className="fila"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span>
                  <strong>{e.nombre}</strong>
                  <br />
                  <span className="suave" style={{ fontSize: "0.875rem" }}>
                    {ejercicio?.nombre}
                  </span>
                </span>
                <span className="chip">{e.ubicacion}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <nav style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
        <Link
          href="/historial"
          className="secundaria"
          style={{ flex: 1, display: "grid", placeContent: "center", textDecoration: "none" }}
        >
          Historial
        </Link>
        <Link
          href="/panel"
          className="secundaria"
          style={{ flex: 1, display: "grid", placeContent: "center", textDecoration: "none" }}
        >
          Panel del gimnasio
        </Link>
      </nav>
    </main>
  );
}
