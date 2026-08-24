"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
// Se importa el build de navegador a propósito. El entry por defecto de
// qrcode arrastra su renderer de Node (fs y pngjs) al bundle del cliente y
// revienta en el render del servidor.
import QRCode from "qrcode/lib/browser";
import { ESTACIONES, buscarEjercicio } from "@/lib/catalogo";
import type { Estacion } from "@/lib/dominio";

/**
 * Panel del gimnasio: de acá salen las etiquetas.
 *
 * Cada estación necesita dos cosas pegadas en la máquina: un QR impreso y un
 * chip NFC escrito con la misma URL. El QR es el que siempre funciona; el NFC
 * es la mejora para quien lo tenga.
 */
/** Suscripción vacía: la disponibilidad de NFC no cambia durante la visita. */
const sinCambios = () => () => {};

export function PanelEstaciones({ base }: { base: string }) {
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<string | null>(null);

  // Se lee como estado externo del navegador: en el servidor no existe, y
  // escribirlo desde un efecto dispara renders en cascada.
  const nfcDisponible = useSyncExternalStore(
    sinCambios,
    () => "NDEFReader" in window,
    () => false,
  );

  useEffect(() => {
    if (!base) return;
    (async () => {
      const generados: Record<string, string> = {};
      for (const e of ESTACIONES) {
        generados[e.id] = await QRCode.toDataURL(`${base}/e/${e.id}`, {
          width: 512,
          margin: 1,
          // Alto nivel de corrección: el QR va pegado a una máquina y se raya.
          errorCorrectionLevel: "H",
          color: { dark: "#0b0d10", light: "#ffffff" },
        });
      }
      setQrs(generados);
    })();
  }, [base]);

  /**
   * Escritura del chip. Web NFC solo existe en Chrome sobre Android y solo en
   * HTTPS, así que es estrictamente opcional: sin esto el gimnasio igual puede
   * escribir los chips con cualquier app de NFC, o usar solo los QR.
   */
  async function escribir(estacion: Estacion) {
    setEstado(`Acercá un chip vacío para "${estacion.nombre}"…`);
    try {
      const Lector = (window as unknown as { NDEFReader: new () => { write: (m: unknown) => Promise<void> } }).NDEFReader;
      const lector = new Lector();
      await lector.write({ records: [{ recordType: "url", data: `${base}/e/${estacion.id}` }] });
      setEstado(`Listo: "${estacion.nombre}" quedó escrita en el chip.`);
    } catch (err) {
      setEstado(`No se pudo escribir: ${err instanceof Error ? err.message : "error desconocido"}`);
    }
  }

  return (
    <>
      <section className="panel" style={{ marginBottom: "1rem" }}>
        <p className="eyebrow">Cómo se arma</p>
        <ol className="suave" style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
          <li style={{ marginBottom: "0.375rem" }}>
            Imprimí el QR de cada estación y pegalo en la máquina, a la altura de los ojos.
          </li>
          <li style={{ marginBottom: "0.375rem" }}>
            Escribí un chip NFC con la misma dirección y pegalo al lado del QR.
          </li>
          <li>
            Probá con un teléfono: la primera lectura abre el ejercicio, la segunda registra una serie.
          </li>
        </ol>
        {!nfcDisponible && (
          <p className="suave" style={{ margin: "0.75rem 0 0", fontSize: "0.875rem" }}>
            Este navegador no puede escribir chips NFC (solo Chrome en Android, con HTTPS).
            Los QR funcionan igual, y los chips se pueden escribir con cualquier app de NFC
            usando la dirección que figura debajo de cada estación.
          </p>
        )}
      </section>

      {estado && (
        <p className="panel" style={{ marginBottom: "1rem" }}>
          {estado}
        </p>
      )}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {ESTACIONES.map((e) => {
          const ejercicio = buscarEjercicio(e.ejercicioId);
          const url = base ? `${base}/e/${e.id}` : "";
          return (
            <article key={e.id} className="panel">
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                {qrs[e.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrs[e.id]}
                    alt={`Código QR de ${e.nombre}`}
                    width={96}
                    height={96}
                    style={{ borderRadius: 8, background: "#fff" }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{e.nombre}</strong>
                  <p className="suave" style={{ margin: "0.125rem 0 0.5rem", fontSize: "0.875rem" }}>
                    {ejercicio?.nombre} · {e.ubicacion}
                  </p>
                  <p
                    className="suave"
                    style={{ margin: 0, fontSize: "0.75rem", wordBreak: "break-all" }}
                  >
                    {url}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                <a
                  className="secundaria"
                  href={qrs[e.id]}
                  download={`qr-${e.id}.png`}
                  style={{ flex: 1, display: "grid", placeContent: "center", textDecoration: "none" }}
                >
                  Descargar QR
                </a>
                {nfcDisponible && (
                  <button type="button" className="secundaria" style={{ flex: 1 }} onClick={() => escribir(e)}>
                    Escribir chip NFC
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
