import assert from "node:assert/strict";
import {
  leerEtiqueta,
  borrarUltimaSerie,
  corregirSerie,
  VENTANA_ANTI_REBOTE_MS,
} from "../src/lib/sesion.ts";
import { volumen } from "../src/lib/dominio.ts";

const CARGA = { peso: 40, reps: 10, unidad: "kg" as const, seriesTotales: 4 };

let ok = 0;
const prueba = (nombre: string, fn: () => void) => {
  fn();
  ok++;
  console.log("  ok  " + nombre);
};

prueba("pasar el teléfono registra la serie 1", () => {
  const r = leerEtiqueta(null, CARGA, 1000);
  assert.equal(r.tipo, "serie-registrada");
  assert.equal(r.sesion.series.length, 1);
  assert.equal(r.sesion.series[0].n, 1);
  assert.equal(r.sesion.series[0].peso, 40);
});

prueba("pasarlo de nuevo registra la serie 2", () => {
  const a = leerEtiqueta(null, CARGA, 1000);
  const b = leerEtiqueta(a.sesion, CARGA, 60000);
  assert.equal(b.sesion.series.length, 2);
  assert.equal(b.sesion.series[1].n, 2);
});

prueba("dos lecturas en el mismo gesto no cuentan doble", () => {
  const a = leerEtiqueta(null, CARGA, 1000);
  const b = leerEtiqueta(a.sesion, CARGA, 1000 + VENTANA_ANTI_REBOTE_MS - 1);
  assert.equal(b.tipo, "rebote");
  assert.equal(b.sesion.series.length, 1);
});

prueba("pasada la ventana, la lectura sí cuenta", () => {
  const a = leerEtiqueta(null, CARGA, 1000);
  const b = leerEtiqueta(a.sesion, CARGA, 1000 + VENTANA_ANTI_REBOTE_MS + 1);
  assert.equal(b.tipo, "serie-registrada");
  assert.equal(b.sesion.series.length, 2);
});

prueba("el descanso se mide solo entre serie y serie", () => {
  const a = leerEtiqueta(null, CARGA, 0);
  const b = leerEtiqueta(a.sesion, CARGA, 90000);
  assert.equal(b.sesion.series[1].descansoPrevio, 90);
  // La primera no tiene descanso previo: no hubo serie anterior.
  assert.equal(b.sesion.series[0].descansoPrevio, undefined);
});

prueba("el contador sigue más allá del objetivo", () => {
  let s = leerEtiqueta(null, CARGA, 0).sesion;
  for (let i = 1; i <= 5; i++) s = leerEtiqueta(s, CARGA, i * 60000).sesion;
  assert.equal(s.series.length, 6);
  assert.equal(s.seriesTotales, 4);
});

prueba("borrar la última renumera las que quedan", () => {
  let s = leerEtiqueta(null, CARGA, 0).sesion;
  s = leerEtiqueta(s, CARGA, 60000).sesion;
  s = leerEtiqueta(s, CARGA, 120000).sesion;
  s = borrarUltimaSerie(s);
  assert.deepEqual(s.series.map((x) => x.n), [1, 2]);
});

prueba("corregir una serie no le cambia la hora", () => {
  const s = leerEtiqueta(null, CARGA, 0).sesion;
  const antes = s.series[0].ts;
  const corregida = corregirSerie(s, 1, { peso: 45 });
  assert.equal(corregida.series[0].peso, 45);
  assert.equal(corregida.series[0].ts, antes);
});

prueba("el volumen es peso por reps sumado", () => {
  let s = leerEtiqueta(null, CARGA, 0).sesion;
  s = leerEtiqueta(s, { ...CARGA, peso: 50, reps: 8 }, 60000).sesion;
  assert.equal(volumen(s.series), 40 * 10 + 50 * 8);
});

console.log(`\n${ok} pruebas pasaron`);
