"use client";

import { useEffect, useState } from "react";
import { leerResena, posponerResena } from "@/lib/almacen";

/** El lugar del gimnasio en Google, donde se deja la reseña. */
const GOOGLE = "https://share.google/fHAdLWPtm5W4c01Gg";

/** El nombre tiene que coincidir con la ficha, o el mapa muestra otra cosa. */
const LUGAR = "Mc Pilates Las Delicias";
const MAPA = `https://www.google.com/maps?q=${encodeURIComponent(LUGAR)}&output=embed`;

/**
 * Invitación a puntuar el gimnasio en Google.
 *
 * Las cinco estrellas llevan todas al mismo lugar: la puntuación real se elige
 * en Google. Mandar solo las buenas y desviar las malas es lo que Google llama
 * "review gating" y está prohibido, además de que se nota.
 *
 * Se pide una vez y se calla: al puntuar desaparece por tres meses, y con
 * "Ahora no" por una semana. Una app que insiste termina desinstalada.
 */
export function Resena() {
  const [visible, setVisible] = useState(false);
  const [marcadas, setMarcadas] = useState(0);
  const [gracias, setGracias] = useState(false);

  useEffect(() => {
    let vivo = true;
    void leerResena().then((oculta) => {
      if (vivo) setVisible(!oculta);
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (!visible) return null;

  /**
   * Se llama DESPUÉS de que el enlace ya abrió Google.
   *
   * La versión anterior usaba `window.open` detrás de un `await`: para cuando
   * la base de datos respondía, el navegador ya no consideraba el gesto de la
   * persona y bloqueaba la ventana. La tarjeta desaparecía y no se abría nada.
   * Un enlace de verdad no tiene ese problema.
   */
  function marcar(n: number) {
    setMarcadas(n);
    setGracias(true);
    void posponerResena(90);
  }

  async function ahoraNo() {
    await posponerResena(7);
    setVisible(false);
  }

  return (
    <section className="resena">
      <p className="eyebrow">Tu opinión</p>
      <p className="fuerte" style={{ margin: "0.25rem 0 0.75rem" }}>
        ¿Cómo estuvo {LUGAR} hoy?
      </p>

      {/* El mapa se ve acá adentro, sin salir de la app. Escribir la reseña sí
          abre Google: no deja meter su formulario en un iframe, a propósito.
          Carga diferida porque está al final de la pantalla y casi nunca se ve. */}
      <iframe
        className="mapa"
        src={MAPA}
        title={`${LUGAR} en Google Maps`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div
        className="estrellas"
        onPointerLeave={() => setMarcadas(0)}
        role="group"
        aria-label="Puntuar el gimnasio en Google"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <a
            key={n}
            className="estrella"
            href={GOOGLE}
            target="_blank"
            rel="noopener noreferrer"
            data-activa={n <= marcadas}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            onPointerEnter={() => setMarcadas(n)}
            onClick={() => marcar(n)}
          >
            ★
          </a>
        ))}
      </div>

      <p className="suave chico" style={{ margin: 0 }}>
        {gracias ? "¡Gracias! Se abrió Google en otra pestaña." : "Se abre Google para dejar la reseña."}
      </p>

      {!gracias && (
        <button type="button" className="enlace-tenue" onClick={ahoraNo}>
          Ahora no
        </button>
      )}
    </section>
  );
}
