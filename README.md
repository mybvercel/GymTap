# GymTap

Acercás el teléfono a la máquina y la serie queda registrada.

Sin cuentas, sin formularios y sin depender de la señal del gimnasio.

## La idea

Cada máquina del gimnasio tiene pegada una etiqueta NFC y un QR, los dos
apuntando a la misma dirección corta: `/e/<estacion>`.

- **La primera lectura** abre el ejercicio. La persona recién llegó a la
  máquina y todavía no levantó nada.
- **Cada lectura siguiente** registra una serie y arranca el descanso.

Ese es el producto entero. El gesto de acercar el teléfono reemplaza al
formulario: no hay que escribir, ni elegir de una lista, ni confirmar. El peso
y las repeticiones vienen de la serie anterior, o de la última vez que se hizo
ese ejercicio, y corregirlos es opcional.

## Por qué no hay backend

Un gimnasio es un sótano con paredes de hormigón y sin señal. Una app que
necesita la red para registrar una serie no sirve justo cuando hace falta.

Todo vive en el teléfono, en IndexedDB. Registrar es instantáneo, funciona en
modo avión y no hay cuenta que crear antes de entrenar. El costo es que el
historial es de ese dispositivo: si el prototipo funciona, ahí se decide si
vale la pena sincronizar.

## Arquitectura

```
src/
  lib/
    dominio.ts     Tipos y reglas de cálculo. Sin dependencias.
    catalogo.ts    Ejercicios y estaciones del gimnasio (hoy, datos en código).
    almacen.ts     Persistencia en IndexedDB. Lo único que toca el disco.
    sesion.ts      Las reglas del entrenamiento. Funciones puras.
  components/
    PantallaEstacion.tsx  La pantalla que abre la etiqueta.
    Descanso.tsx          Temporizador de descanso.
    ResumenSesion.tsx     El entrenamiento en curso.
    ListaHistorial.tsx    Entrenamientos guardados.
    PanelEstaciones.tsx   QR y escritura de chips NFC.
  app/
    e/[estacion]/  Destino de la etiqueta NFC y del QR.
    historial/     Historial con filtros por ejercicio y grupo muscular.
    panel/         Panel del gimnasio.
pruebas/
  sesion.test.ts   Las reglas del tap, sin navegador.
```

La separación importante es entre `sesion.ts` y todo lo demás. Las reglas del
entrenamiento son funciones puras que reciben una sesión y devuelven otra: se
prueban sin navegador y sin base de datos. Persistir es problema de
`almacen.ts`; pintar, de los componentes.

## Decisiones que no son obvias

**La estación no es el ejercicio.** Un banco plano sirve para varios
ejercicios, y un gimnasio puede tener tres poleas idénticas. Cada etiqueta
apunta a una estación, y la estación decide qué ejercicio abre. Sin esa
separación no se puede saber qué máquina se usa más.

**Ventana anti rebote de 4 segundos.** El NFC dispara la lectura apenas el
teléfono se acerca, y es facilísimo que lea dos veces en el mismo gesto. Sin
esa ventana, apoyar el celular registraría dos series. Cuatro segundos filtra
el rebote sin molestar: nadie hace dos series en cuatro segundos.

**El descanso se mide, no se pide.** Cada serie guarda cuánto se descansó
realmente antes de ella, calculado entre marcas de tiempo. Es un dato que sale
gratis y que nadie cargaría a mano.

**El temporizador cuenta contra una marca de tiempo futura**, no restando de a
un segundo. Cuando el teléfono se bloquea, el navegador frena los intervalos y
un contador se atrasaría. Comparar contra el reloj hace que al volver a mirar
el número sea el correcto.

**Web NFC es una mejora, no un requisito.** Solo existe en Chrome sobre
Android y con HTTPS. La app entera funciona con el QR, y el panel avisa cuando
el navegador no puede escribir chips.

## Correr el proyecto

```bash
npm install
npm run dev
```

Queda en `http://localhost:3010`. Para probar el flujo sin etiquetas, entrá a
`/` y elegí una máquina de la lista: navegar a `/e/<estacion>` es exactamente
lo que hace el NFC.

Hay 17 pruebas, que corren sin navegador:

```bash
npm test
```

Cubren las reglas del tap (`pruebas/sesion.test.ts`) y las etiquetas
(`pruebas/etiquetas.test.ts`), que además **generan cada QR y lo vuelven a
decodificar**: si un QR sale mal hay que despegar y reimprimir todo, así que no
alcanza con confiar en que la librería hace lo suyo.

## Estado

Prototipo funcionando: lectura de etiqueta, registro de series, descanso,
historial con filtros, generación de QR y escritura de chips NFC.

Lo que todavía no está: service worker para que la PWA abra sin red, edición
del catálogo desde el panel (hoy los ejercicios y las estaciones viven en
`catalogo.ts`), unidades en libras y compartir el resumen.
