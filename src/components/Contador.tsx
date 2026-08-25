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
import { Resena } from "./Resena";

/**
 * La pantalla única: el destino del chip NFC.
 *
 * Pasar el teléfono registra una serie. El problema es que "pasar el teléfono"
 * no siempre significa lo mismo para el navegador:
 *
 *  - Si la app estaba cerrada, Android abre la página: hay carga nueva.
 *  - Si la app YA estaba abierta, Android no recarga nada: solo trae la
 *    pestaña al frente. La página no se entera de que la abrieron de nuevo.
 *
 * El segundo caso es el habitual en el gimnasio, así que la serie no se
 * registra al cargar la página sino al quedar la pantalla a la vista, que es
 * lo que pasa en los dos casos. La ventana anti rebote evita que la carga
 * inicial cuente dos veces.
 */
export function Contador() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [ajustes, setAjustes] = useState<Ajustes | null>(null);
  const [cargando, setCargando] = useState(true);
  const [peso, setPeso] = useState(0);
  const [reps, setReps] = useState(10);
  const [descansando, setDescansando] = useState(false);

  // Espejo del estado para los escuchas del navegador, que si no leerían los
  // valores del primer render para siempre.
  const actual = useRef({ sesion, ajustes, peso, reps });
  useEffect(() => {
    actual.current = { sesion, ajustes, peso, reps };
  });

  const registrar = useCallback(async (ventana?: number) => {
    const c = actual.current;
    const prefs = c.ajustes ?? (await leerAjustes());
    const previa = c.sesion ?? (await leerSesionActiva());

    const lectura = leerEtiqueta(
      previa,
      {
        peso: c.peso,
        reps: c.reps,
        unidad: prefs.unidad,
        seriesTotales: previa?.seriesTotales ?? prefs.seriesTotales,
      },
      Date.now(),
      ventana,
    );

    setSesion(lectura.sesion);
    await guardarSesionActiva(lectura.sesion);
    if (lectura.tipo === "serie-registrada") setDescansando(true);
  }, []);

  // Arranque: se traen la sesión y la carga guardadas antes de contar nada.
  useEffect(() => {
    let vivo = true;
    (async () => {
      const [previa, prefs] = await Promise.all([leerSesionActiva(), leerAjustes()]);
      const sugerida = previa?.series.at(-1) ?? (await ultimaCarga());
      if (!vivo) return;
      const carga = { peso: sugerida?.peso ?? 0, reps: sugerida?.reps ?? 10 };
      setAjustes(prefs);
      setPeso(carga.peso);
      setReps(carga.reps);
      setSesion(previa);
      actual.current = { sesion: previa, ajustes: prefs, ...carga };
      setCargando(false);
      await registrar();
    })();
    return () => {
      vivo = false;
    };
  }, [registrar]);

  // Volver a la vista es la señal de que pasaron el teléfono.
  useEffect(() => {
    if (cargando) return;
    const alVolver = () => {
      if (document.visibilityState === "visible") void registrar();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    window.addEventListener("pageshow", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
      window.removeEventListener("pageshow", alVolver);
    };
  }, [cargando, registrar]);

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

  if (cargando || !ajustes) {
    return (
      <main className="marco centrado">
        <p className="suave">Registrando…</p>
      </main>
    );
  }

  // Terminada la tanda, la pantalla queda limpia hasta el próximo pase.
  if (!sesion || sesion.series.length === 0) {
    return (
      <main className="marco centrado">
        <p className="eyebrow">Listo</p>
        <h1 className="titulo">Pasá el teléfono para empezar</h1>
        <p className="suave">Cada vez que lo pases queda registrada una serie.</p>
        <button type="button" className="accion" onClick={() => registrar(0)}>
          Registrar serie
        </button>
        <Link href="/historial" className="secundaria enlace">
          Ver historial
        </Link>
        <Resena />
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

      {/* Red de seguridad: si el teléfono no dispara nada, el dedo sí. */}
      <button type="button" className="accion" onClick={() => registrar(0)}>
        Registrar serie
      </button>

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

      <Resena />
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
