# Mejora en el formato de informes

Formato de entregas de informes interno para visualizar los resultados semanales de las activaciones/promociones: KPIs de desempeño, evolución semanal (en línea o por % de cumplimiento), insights automáticos y evidencia fotográfica en punto de venta.

Construido con **HTML, CSS y JavaScript puro** (sin frameworks ni build tools), pensado para que cualquier persona del equipo pueda editarlo directamente sin necesitar herramientas adicionales.

> 📌 **Estado actual:** maqueta funcional con datos de ejemplo. Los datos reales (KPIs, semanas, evidencias) se cargan a mano en el código — ver sección [Cómo actualizar los datos](#-cómo-actualizar-los-datos-semana-a-semana). La conexión a una fuente de datos real (ej. Power BI u otra API) está planeada pero no implementada todavía.

---

## Índice

- [Vista general](#vista-general)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Cómo abrir el proyecto](#cómo-abrir-el-proyecto)
- [Componentes del dashboard](#componentes-del-dashboard)
- [Cómo actualizar los datos semana a semana](#-cómo-actualizar-los-datos-semana-a-semana)
- [Decisiones de diseño importantes](#decisiones-de-diseño-importantes)
- [Cómo agregar un 6to KPI](#cómo-agregar-un-6to-kpi)
- [Compatibilidad](#compatibilidad)
- [Roadmap / pendientes conocidos](#roadmap--pendientes-conocidos)

---

## Vista general

El dashboard tiene 3 zonas principales:

1. **Header**: logo, título y 4 filtros (Tipo de control, SKU, Ciudad, Semana).
2. **Fila de KPI cards**: 5 tarjetas con efecto flip (al pasar el mouse muestran la definición del KPI), cada una con su % de cumplimiento y una barra de progreso coloreada.
3. **Contenido principal**, dividido en dos paneles:
   - **Panel izquierdo**: gráfico de evolución semanal de los 5 KPIs (con un toggle para alternar entre vista de **Resultado** —gráfico de líneas— y **% Cumplimiento** —gráfico de barras—), más un carrusel de **Insights de la semana**.
   - **Panel derecho**: carrusel de **evidencia fotográfica** en PDV.

El layout está diseñado para **no generar scroll bajo ninguna circunstancia** (requisito del proyecto): todo se ajusta al alto de la ventana usando Flexbox.

---

## Estructura del proyecto

```
index.html        # Estructura completa de la página
├── 📂 img       # Logo, fotos de evidencia, etc.
├── 📁 styles
│   ├── 📄 styles.css            
│   └── 📄 botones.css
│   └── 📄 KPI.css
│   └── 📄 grafico_de_lineas.css
│   └── 📄 Insights.css
│   └── 📄 Carousel.css
├── 📁 js
│   ├── 📄 botones.js           
│   └── 📄 KPI.js
│   └── 📄 grafico_de_lineas.js
│   └── 📄 Insights.js
└── └── 📄 Carousel.js
```

Cada componente visual tiene su propio par de archivos CSS/JS, independientes entre sí. La idea es que se pueda modificar o reemplazar cualquiera de ellos sin romper los demás.

---

## Cómo abrir el proyecto

No requiere instalación ni build. Basta con:

1. Clonar el repositorio.
2. Abrir `index.html` directamente en el navegador (doble clic, o extensión "Live Server" de VS Code para recarga automática al editar).

No hay dependencias externas más que la fuente **Poppins**, que se importa desde Google Fonts vía `<link>` en el `<head>` de `index.html` (requiere conexión a internet la primera vez que carga).

---

## Componentes del dashboard

### 🔽 Filtros del header (`botones.css` / `botones.js`)
Dropdowns genéricos: el JS detecta automáticamente cualquier `.dropdown-wrapper` que exista en la página, así que agregar un 5to filtro es tan simple como copiar el bloque HTML de uno existente — no hay que tocar el JS.

> ⚠️ Actualmente los 4 filtros muestran las mismas opciones de ejemplo (Todos/Manual/Automático/etc.) y no filtran datos reales todavía — es solo la interfaz visual.

### 🟩 KPI Cards (`KPI.css` / `KPI.js`)
Cada tarjeta tiene `data-compliance="XX"` en el HTML (el % de cumplimiento). El JS (`KPI.js`) lee ese número y automáticamente:
- Le asigna un color de estado: **verde** (≥80%), **naranja** (50-79%), **rojo** (<50%).
- Rellena la barra de progreso.

Al pasar el mouse, la tarjeta gira (efecto flip 3D) y muestra la definición del KPI.

### 📈 Gráfico de evolución semanal (`grafico_de_lineas.css` / `grafico_de_lineas.js`)
El componente más complejo del proyecto. Tiene **2 modos**, alternables con el toggle "Resultado" / "% Cumplimiento":

- **Resultado**: gráfico de líneas con el valor real de cada semana + línea punteada de meta.
- **% Cumplimiento**: gráfico de barras con el % de cumplimiento de cada semana respecto a su meta (0-100%, coloreado por umbral).

Ambos modos comparten el mismo `<svg>` y el mismo tooltip (se limpia y se vuelve a dibujar al cambiar de modo). El **número grande al final de cada fila es 100% editable a mano** — no se calcula solo — para más detalle ver la siguiente sección.

### 💡 Insights de la semana (`Insights.css` / `Insights.js`)
Carrusel simple con rotación automática cada 4.5s + flechas de navegación manual. Los datos viven en un array `DATOS_INSIGHTS_NUEVO` dentro del JS.

### 🖼️ Evidencia en PDV (`Carousel.css` / `Carousel.js`)
Carrusel de fotos con tamaño fijo (recorte via `object-fit: cover`, así todas las fotos se ven parejas sin importar su resolución original). Genérico: detecta automáticamente cuántas `<li class="carousel-slide">` haya — agregar o quitar fotos no requiere tocar el JS.

---

## 🔧 Cómo actualizar los datos semana a semana

Esta es la sección más importante para el uso diario. Todo lo editable a mano vive en **`grafico_de_lineas.js`**, en 5 objetos (`kpi1Data` a `kpi5Data`), uno por KPI.

```js
const kpi1Data = {
    title: 'SELL OUT (SO)',
    subtitle: 'TM',
    goal: 110,               // Meta de la semana (se usa para la línea punteada
                              // y para calcular el % de cumplimiento en modo barras)
    format: 'toneladas',

    // Número grande al final de la fila — 100% manual, NO se calcula solo.
    resultado:    { texto: '113 TM', colorValor: 100 },
    cumplimiento: { texto: '102%',   colorValor: 102 },

    weeks: [
      { week: 'Semana 1', value: 128 },
      { week: 'Semana 2', value: 85 },
      // ... una entrada por semana
    ]
};
```

**Qué campo tocar según lo que quieras cambiar:**

| Quiero cambiar... | Edito... |
|---|---|
| El valor de una semana puntual | `weeks[i].value` |
| El nombre de una semana | `weeks[i].week` |
| La meta del KPI | `goal` |
| El texto grande final (modo Resultado) | `resultado.texto` |
| El color del texto/línea (modo Resultado) | `resultado.colorValor` (número 0-100+: ≥80 verde, 50-79 naranja, <50 rojo) |
| El texto grande final (modo % Cumplimiento) | `cumplimiento.texto` |
| El color de ese texto | `cumplimiento.colorValor` (mismos umbrales de arriba) |

> ℹ️ `colorValor` **no tiene que coincidir** con el texto mostrado — es solo el número que decide qué color se pinta. Por ejemplo, puedes mostrar `"N/D"` como texto y poner `colorValor: 45` para que salga en rojo.

> ⚠️ Excepción: **BRECHA** (`kpi2Data`) tiene un campo extra `metaEsTecho: true`, porque en ese KPI un valor **más bajo** es mejor (la meta es un techo que no se quiere superar). Si agregas otro KPI con esa misma lógica, replica ese campo.

---

## Decisiones de diseño importantes

Estas decisiones están documentadas también como comentarios en el código, pero se resumen aquí para referencia rápida:

- **Layout sin scroll**: `html`/`body` miden exactamente el alto de la ventana y tienen `overflow: hidden`. El resto de los paneles usan Flexbox para repartirse el espacio disponible (ver el comentario grande al inicio de `styles.css`). **Importante:** los contenedores internos (`.left-panel`, `.tablero-grafico-linea`, `.tarjeta-kpi-grafico-linea`) *no* deben llevar `overflow: hidden`, porque eso recorta el tooltip del gráfico cuando aparece pegado al borde superior de una fila.
- **El número grande final es manual, no calculado**: se decidió así porque la fórmula real de negocio para "cumplimiento" varía según el KPI y la maneja el equipo/cliente directamente — más simple mantener un texto editable que una fórmula que puede quedar desactualizada.
- **El color sí se mantiene automático**: aunque el texto es libre, el color (verde/naranja/rojo) se sigue derivando de un número (`colorValor`), para no perder ese indicador visual.
- **Un solo `<svg>` reciclado por fila**: en vez de tener un SVG por modo, cada tarjeta del gráfico de evolución tiene un único `<svg>` que se limpia (`innerHTML = ''`) y se vuelve a dibujar al cambiar de modo — evita duplicar el tooltip y otros elementos.

---

## Cómo agregar un 6to KPI

1. En `index.html`, duplica un bloque `<article class="kpi-card" data-compliance="XX">...</article>` (fila de arriba) y un bloque `<div class="tarjeta-kpi-grafico-linea" id="kpiX-grafico-linea">...</div>` (gráfico de evolución), cambiando los IDs.
2. En `grafico_de_lineas.js`, crea un nuevo `kpi6Data` (copiando la estructura de cualquiera de los existentes).
3. Agrégalo al array `CONFIGURACION_KPIS_GRAFICO_LINEA` al final del archivo.

El resto (colores, barra de progreso, toggle Resultado/Cumplimiento) se adapta solo.

---

## Compatibilidad

Probado visualmente en las últimas versiones de Chrome/Edge. Usa únicamente APIs web estándar (Flexbox, CSS Grid, SVG, `fetch`-free JS vanilla), por lo que debería funcionar en cualquier navegador moderno sin necesidad de polyfills.

---

## Roadmap / pendientes conocidos

- [ ] Conectar los filtros del header (Tipo de control, SKU, Ciudad, Semana) a datos reales — actualmente son solo visuales.
- [ ] Reemplazar la carga manual de datos en `grafico_de_lineas.js` por una fuente real (API / Power BI / hoja de cálculo).
- [ ] Unificar los datos de las KPI cards (fila de arriba, `data-compliance`) con los del gráfico de evolución — actualmente son dos fuentes de datos independientes y hay que actualizar ambas a mano.
- [ ] Definir listas de opciones reales para cada filtro (actualmente todos comparten la misma lista de ejemplo).
