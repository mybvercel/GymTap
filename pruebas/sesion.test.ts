import assert from "node:assert/strict";
import {
  leerEtiqueta,
  borrarUltimaSerie,
  corregirSerie,
  cerrarBloque,
  VENTANA_ANTI_REBOTE_MS,
} from "../src/lib/sesion.ts";
import { volumen } from "../src/lib/dominio.ts";

const CARGA = { peso: 40, reps: 10, unidad: "kg" as const };
let ok = 0;
const prueba = (nombre: string, fn: () => void) => {
  fn();
  ok++;
  console.log("  ok  " + nombre);
};

prueba("la primera lectura abre el ejercicio y no registra serie", () => {
  const r = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 1000);
  assert.equal(r.tipo, "abierto");
  assert.equal(r.sesion.bloques.length, 1);
  assert.equal(r.sesion.bloques[0].series.length, 0);
});

prueba("la segunda lectura registra la serie 1", () => {
  const a = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 1000);
  const b = leerEtiqueta(a.sesion, "banco-1", "press-banca", CARGA, 60000);
  assert.equal(b.tipo, "serie-registrada");
  assert.equal(b.sesion.bloques[0].series.length, 1);
  assert.equal(b.sesion.bloques[0].series[0].n, 1);
  assert.equal(b.sesion.bloques[0].series[0].peso, 40);
});

prueba("dos lecturas seguidas no registran dos series (anti rebote)", () => {
  const a = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 1000);
  const b = leerEtiqueta(a.sesion, "banco-1", "press-banca", CARGA, 60000);
  const c = leerEtiqueta(b.sesion, "banco-1", "press-banca", CARGA, 60000 + VENTANA_ANTI_REBOTE_MS - 1);
  assert.equal(c.tipo, "rebote");
  assert.equal(c.sesion.bloques[0].series.length, 1);
});

prueba("pasada la ventana, la lectura sí registra", () => {
  const a = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 1000);
  const b = leerEtiqueta(a.sesion, "banco-1", "press-banca", CARGA, 60000);
  const c = leerEtiqueta(b.sesion, "banco-1", "press-banca", CARGA, 60000 + VENTANA_ANTI_REBOTE_MS + 1);
  assert.equal(c.tipo, "serie-registrada");
  assert.equal(c.sesion.bloques[0].series.length, 2);
});

prueba("el descanso se mide solo entre serie y serie", () => {
  const a = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 0);
  const b = leerEtiqueta(a.sesion, "banco-1", "press-banca", CARGA, 10000);
  const c = leerEtiqueta(b.sesion, "banco-1", "press-banca", CARGA, 100000);
  const serie2 = c.sesion.bloques[0].series[1];
  assert.equal(serie2.descansoPrevio, 90);
  assert.equal(c.sesion.bloques[0].series[0].descansoPrevio, undefined);
});

prueba("cambiar de máquina cierra el bloque anterior y abre otro", () => {
  const a = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 0);
  const b = leerEtiqueta(a.sesion, "banco-1", "press-banca", CARGA, 10000);
  const c = leerEtiqueta(b.sesion, "polea-1", "remo-polea", CARGA, 20000);
  assert.equal(c.sesion.bloques.length, 2);
  assert.equal(c.sesion.bloques[0].cerrado, true);
  assert.equal(c.sesion.bloques[1].cerrado, false);
  assert.equal(c.sesion.bloques[1].ejercicioId, "remo-polea");
});

prueba("volver a una máquina anterior abre un bloque nuevo, no revive el viejo", () => {
  let s = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 0).sesion;
  s = leerEtiqueta(s, "banco-1", "press-banca", CARGA, 10000).sesion;
  s = leerEtiqueta(s, "polea-1", "remo-polea", CARGA, 20000).sesion;
  s = leerEtiqueta(s, "banco-1", "press-banca", CARGA, 30000).sesion;
  assert.equal(s.bloques.length, 3);
  assert.equal(s.bloques.filter((b) => !b.cerrado).length, 1);
});

prueba("borrar la última serie renumera las que quedan", () => {
  let s = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 0).sesion;
  s = leerEtiqueta(s, "banco-1", "press-banca", CARGA, 10000).sesion;
  s = leerEtiqueta(s, "banco-1", "press-banca", CARGA, 20000).sesion;
  s = borrarUltimaSerie(s, "banco-1");
  assert.equal(s.bloques[0].series.length, 1);
  assert.deepEqual(s.bloques[0].series.map((x) => x.n), [1]);
});

prueba("corregir una serie no le cambia la hora", () => {
  let s = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 0).sesion;
  s = leerEtiqueta(s, "banco-1", "press-banca", CARGA, 10000).sesion;
  const antes = s.bloques[0].series[0].ts;
  s = corregirSerie(s, "banco-1", 1, { peso: 45 });
  assert.equal(s.bloques[0].series[0].peso, 45);
  assert.equal(s.bloques[0].series[0].ts, antes);
});

prueba("el volumen es peso por reps sumado", () => {
  let s = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 0).sesion;
  s = leerEtiqueta(s, "banco-1", "press-banca", CARGA, 10000).sesion;
  s = leerEtiqueta(s, "banco-1", "press-banca", { peso: 50, reps: 8, unidad: "kg" }, 20000).sesion;
  assert.equal(volumen(s.bloques[0].series), 40 * 10 + 50 * 8);
});

prueba("cerrar un bloque le impide seguir recibiendo series", () => {
  let s = leerEtiqueta(null, "banco-1", "press-banca", CARGA, 0).sesion;
  s = leerEtiqueta(s, "banco-1", "press-banca", CARGA, 10000).sesion;
  s = cerrarBloque(s, "banco-1");
  const r = leerEtiqueta(s, "banco-1", "press-banca", CARGA, 20000);
  assert.equal(r.tipo, "abierto");
  assert.equal(r.sesion.bloques.length, 2);
});

console.log("\n" + ok + " pruebas pasaron");
