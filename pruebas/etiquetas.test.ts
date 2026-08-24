import assert from "node:assert/strict";
import QRCode from "qrcode";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { ESTACIONES, resolverEstacion, estacionesDe } from "../src/lib/catalogo.ts";

/**
 * Las etiquetas son lo único del sistema que se imprime y se pega en una
 * máquina: si un QR decodifica mal, hay que despegar y reimprimir todo. Por eso
 * se genera y se vuelve a leer de verdad, en vez de confiar en que la librería
 * hace lo suyo.
 */

const BASE = "https://gimnasio.test";
let ok = 0;
const prueba = async (nombre: string, fn: () => void | Promise<void>) => {
  await fn();
  ok++;
  console.log("  ok  " + nombre);
};

/** Genera el QR con las mismas opciones que usa el panel y lo decodifica. */
async function leerQr(url: string): Promise<string | null> {
  const buffer = await QRCode.toBuffer(url, {
    width: 512,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#0b0d10", light: "#ffffff" },
  });
  const png = PNG.sync.read(buffer);
  const leido = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return leido ? leido.data : null;
}

async function main() {
  await prueba("cada estación genera un QR que decodifica a su propia URL", async () => {
    for (const estacion of ESTACIONES) {
      const url = `${BASE}/e/${estacion.id}`;
      assert.equal(await leerQr(url), url, `falló el QR de ${estacion.id}`);
    }
  });

  await prueba("los identificadores de estación entran en un chip NFC chico", () => {
    for (const estacion of ESTACIONES) {
      const url = `${BASE}/e/${estacion.id}`;
      // Un NTAG213, el más barato y común, deja unos 132 bytes utilizables.
      assert.ok(url.length < 132, `${url} es demasiado larga para un NTAG213`);
    }
  });

  await prueba("no hay dos estaciones con el mismo id", () => {
    const ids = ESTACIONES.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  await prueba("toda estación apunta a un ejercicio que existe", () => {
    for (const estacion of ESTACIONES) {
      assert.ok(resolverEstacion(estacion.id), `${estacion.id} apunta a un ejercicio inexistente`);
    }
  });

  await prueba("un ejercicio puede tener varias estaciones", () => {
    // Es la razón de que estación y ejercicio sean cosas distintas.
    assert.ok(estacionesDe("press-banca").length >= 2);
    assert.ok(estacionesDe("remo-polea").length >= 2);
  });

  await prueba("una estación desconocida no resuelve", () => {
    assert.equal(resolverEstacion("no-existe"), null);
  });

  console.log(`
${ok} pruebas pasaron`);
}

main();
