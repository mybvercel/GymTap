"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DESCANSOS } from "@/lib/dominio";

interface Props {
  segundos: number;
  sonido: boolean;
  vibracion: boolean;
  onTerminar: () => void;
  onCambiarPreferido: (segundos: number) => void;
}

/**
 * Temporizador de descanso.
 *
 * Cuenta contra una marca de tiempo futura, no con un contador que va
 * restando. Es la diferencia entre funcionar y no: cuando el teléfono se
 * bloquea o la persona cambia de app, el navegador frena los intervalos, y un
 * contador se atrasaría. Comparar contra `Date.now()` hace que al volver a
 * mirar el número sea el correcto, aunque el intervalo no haya corrido.
 */
export function Descanso({ segundos, sonido, vibracion, onTerminar, onCambiarPreferido }: Props) {
  const [finTs, setFinTs] = useState(() => Date.now() + segundos * 1000);
  const [pausadoEn, setPausadoEn] = useState<number | null>(null);
  const [restante, setRestante] = useState(segundos);
  const [total, setTotal] = useState(segundos);
  const yaAviso = useRef(false);

  useEffect(() => {
    const tick = () => {
      const ahora = pausadoEn ?? Date.now();
      const seg = Math.max(0, Math.ceil((finTs - ahora) / 1000));
      setRestante(seg);
      if (seg === 0 && !yaAviso.current) {
        yaAviso.current = true;
        avisar({ sonido, vibracion });
      }
    };
    tick();
    const id = setInterval(tick, 250);
    // Al volver de segundo plano el intervalo estuvo frenado: se recalcula ya.
    const alVolver = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [finTs, pausadoEn, sonido, vibracion]);

  const ajustar = useCallback((delta: number) => {
    const ahora = Date.now();
    yaAviso.current = false;
    setFinTs((f) => Math.max(ahora, f + delta * 1000));
    setTotal((t) => Math.max(5, t + delta));
  }, []);

  const elegir = useCallback((seg: number) => {
    const ahora = Date.now();
    yaAviso.current = false;
    setTotal(seg);
    setFinTs(ahora + seg * 1000);
    setPausadoEn(null);
    onCambiarPreferido(seg);
  }, [onCambiarPreferido]);

  const alternarPausa = useCallback(() => {
    if (pausadoEn === null) {
      setPausadoEn(Date.now());
    } else {
      // Se corre el final tanto como duró la pausa.
      const pausa = Date.now() - pausadoEn;
      setFinTs((f) => f + pausa);
      setPausadoEn(null);
    }
  }, [pausadoEn]);

  const terminado = restante === 0;
  const radio = 92;
  const circunferencia = 2 * Math.PI * radio;
  const avance = total > 0 ? Math.min(1, restante / total) : 0;

  return (
    <section className="panel" style={{ display: "grid", gap: "1rem", justifyItems: "center" }}>
      <p className="eyebrow">{terminado ? "Descanso terminado" : "Descansando"}</p>

      <div style={{ position: "relative", width: 220, height: 220 }}>
        <svg className="aro" width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
          <circle className="pista" cx="110" cy="110" r={radio} />
          <circle
            className="avance"
            cx="110"
            cy="110"
            r={radio}
            strokeDasharray={circunferencia}
            strokeDashoffset={circunferencia * (1 - avance)}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
            textAlign: "center",
          }}
        >
          <p className="numeron descanso-num" aria-live="off">
            {terminado ? "0" : formatear(restante)}
          </p>
          {pausadoEn !== null && !terminado && <p className="eyebrow">En pausa</p>}
        </div>
      </div>

      {/* El aviso importante se anuncia una sola vez, no cada segundo. */}
      <p role="status" style={{ margin: 0, minHeight: "1.5rem", fontWeight: 700 }}>
        {terminado ? "Listo para la próxima serie" : " "}
      </p>

      <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
        <button type="button" className="secundaria" style={{ flex: 1 }} onClick={() => ajustar(-15)}>
          −15 s
        </button>
        <button type="button" className="secundaria" style={{ flex: 1 }} onClick={alternarPausa}>
          {pausadoEn === null ? "Pausar" : "Seguir"}
        </button>
        <button type="button" className="secundaria" style={{ flex: 1 }} onClick={() => ajustar(15)}>
          +15 s
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", justifyContent: "center" }}>
        {DESCANSOS.map((s) => (
          <button
            key={s}
            type="button"
            className="secundaria"
            style={{
              minHeight: 44,
              paddingInline: "0.75rem",
              borderColor: s === total ? "var(--descanso)" : "var(--linea)",
              color: s === total ? "var(--descanso)" : "var(--texto-suave)",
            }}
            onClick={() => elegir(s)}
          >
            {s}s
          </button>
        ))}
      </div>

      <button type="button" className="accion" onClick={onTerminar}>
        {terminado ? "Seguir entrenando" : "Terminar descanso"}
      </button>
    </section>
  );
}

function formatear(seg: number): string {
  if (seg < 60) return String(seg);
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Aviso de fin de descanso. Vibración y un pitido corto generado en el momento,
 * para no cargar un archivo de audio que ademas el navegador puede bloquear.
 */
function avisar({ sonido, vibracion }: { sonido: boolean; vibracion: boolean }) {
  if (vibracion && typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([120, 60, 120]);
  }
  if (!sonido) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gan = ctx.createGain();
    osc.frequency.value = 880;
    gan.gain.setValueAtTime(0.0001, ctx.currentTime);
    gan.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gan.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.connect(gan).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    osc.onended = () => void ctx.close();
  } catch {
    /* Sin audio disponible: la vibración ya avisó. */
  }
}
