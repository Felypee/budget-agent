# Monedita - Sistema de Pricing con Tokens ("Moneditas")

> Ultima actualizacion: Febrero 2026

## Resumen Rapido de Costos

### Costos Fijos Actuales: $6.25/mes

| Servicio | Costo |
|----------|-------|
| Railway | $5.00 |
| Supabase | $0 (free tier) |
| Dominio | $1.25 ($15/año) |
| Monitoring | $0 (sin Sentry) |

### Costos Variables

| Por Operacion | Costo |
|---------------|-------|
| Texto | $0.009 |
| Imagen | $0.010 |
| Audio | $0.004 |
| Wompi | ~12% del pago |

### Proyeccion por Escala

| Usuarios | Costos Fijos | Costos Variables | Total | Ingreso | Ganancia |
|----------|--------------|------------------|-------|---------|----------|
| **100** | $6.25 | $96.92 | $103 | $110 | **+$7 (6%)** |
| **500** | $46.25 | $545.40 | $592 | $649 | **+$57 (9%)** |
| **2000** | $101.25 | $2,486.00 | $2,587 | $3,093 | **+$506 (16%)** |

---

## Tabla de Contenidos

1. [Resumen del Nuevo Sistema](#resumen-del-nuevo-sistema)
2. [Costos Reales por Operacion](#costos-reales-por-operacion)
3. [Planes de Suscripcion](#planes-de-suscripcion)
4. [Consumo de Moneditas](#consumo-de-moneditas)
5. [Analisis de Rentabilidad](#analisis-de-rentabilidad)
6. [Escenarios de Usuarios](#escenarios-de-usuarios)
7. [Costos de Infraestructura](#costos-de-infraestructura)
8. [Estrategias y Recomendaciones](#estrategias-y-recomendaciones)

---

## Resumen del Nuevo Sistema

### Cambio de Modelo

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Modelo** | 5 limites separados (texto, voz, imagen, AI, budgets) | 1 recurso universal (moneditas) |
| **Budgets** | Limitados por plan | Ilimitados para todos |
| **Resumen semanal** | Solo planes pagos | Todos los planes |
| **Pagina visual** | No existia (CSV export) | Todos los planes |
| **Complejidad** | Alta (5 contadores) | Simple (1 contador) |

### Por que el Cambio

1. **Mas simple de entender** - Los usuarios ven un solo numero
2. **Mas justo** - Pagan por lo que realmente usan
3. **Mejor conversion** - Free plan mas atractivo = mas usuarios prueban = mas upgrades
4. **Similar a Claude Code** - Modelo probado en el mercado

---

## Costos Reales por Operacion

### APIs Externas (Febrero 2026)

| Servicio | Modelo | Pricing |
|----------|--------|---------|
| **Claude API** | Sonnet 4.5 | $3/M input, $15/M output |
| **Claude Vision** | Sonnet 4.5 | Mismo precio (imagen = ~1600 tokens) |
| **Groq Whisper** | Large v3 | Gratis (free tier) |
| **OpenAI Whisper** | Whisper-1 | $0.006/minuto (fallback) |
| **WhatsApp API** | Business | $0.0008/msg utility (Colombia) |

### Costo por Tipo de Operacion

| Operacion | Tokens (in/out) | Costo Claude | Costo WA | **Total** |
|-----------|-----------------|--------------|----------|-----------|
| **Mensaje texto** | ~1400/300 | $0.0042 + $0.0045 | $0 | **~$0.009** |
| **Imagen/recibo OCR** | ~2500/150 | $0.0075 + $0.0023 | $0 | **~$0.010** |
| **Audio (30 seg)** | ~600/150 | $0.0018 + $0.0023 | $0 | **~$0.004** |
| **Resumen semanal** | ~800/400 | $0.0024 + $0.0060 | $0.0008 | **~$0.009** |
| **Mensaje saliente WA** | - | - | $0.0008 | **~$0.001** |

> Nota: Mensajes de texto incluyen overhead de tool definitions (~770 tokens)

---

## Planes de Suscripcion

### Definicion de Planes

| Caracteristica | **Free** | **Basic** | **Premium** |
|----------------|----------|-----------|-------------|
| **Precio** | $0 | $2.99/mes | $7.99/mes |
| **Precio COP** | $0 | ~$12,000 | ~$32,000 |
| **Moneditas/mes** | 50 | 250 | 800 |
| **Presupuestos** | Ilimitado | Ilimitado | Ilimitado |
| **Resumen semanal** | Si | Si | Si |
| **Pagina visual** | Si | Si | Si |
| **Historial** | 30 dias | 6 meses | 12 meses |
| **Soporte** | Comunidad | Email | Prioritario |

### Cambios vs Sistema Anterior

| Caracteristica | Antes | Ahora |
|----------------|-------|-------|
| Budgets Free | 1 | Ilimitado |
| Budgets Basic | 5 | Ilimitado |
| CSV Export | Basic+ | Eliminado |
| PDF Export | Premium | Eliminado |
| Pagina visual | No existia | Todos |
| Resumen semanal | No existia | Todos |

---

## Consumo de Moneditas

### Costo por Accion

| Accion | Moneditas | Costo Real | Margen |
|--------|-----------|------------|--------|
| Registrar gasto (texto) | 1 | ~$0.009 | - |
| Procesar recibo (imagen) | 3 | ~$0.010 | - |
| Procesar audio | 2 | ~$0.004 | - |
| Recibir resumen semanal | 2 | ~$0.009 | - |
| Mensaje recordatorio | 1 | ~$0.001 | - |

### Que Puedes Hacer con tus Moneditas

| Uso | Free (50) | Basic (250) | Premium (800) |
|-----|-----------|-------------|---------------|
| **Solo texto** (1 c/u) | 50 gastos | 250 gastos | 800 gastos |
| **Solo imagenes** (3 c/u) | 16 recibos | 83 recibos | 266 recibos |
| **Solo audios** (2 c/u) | 25 audios | 125 audios | 400 audios |
| **Uso mixto tipico*** | ~40 gastos | ~200 gastos | ~650 gastos |

*Uso mixto tipico: 70% texto, 20% imagen, 10% audio

### Calculo de Uso Mixto Tipico

```
Free (50 moneditas):
- 35 textos x 1 = 35
- 4 imagenes x 3 = 12
- 1.5 audios x 2 = 3
= 50 moneditas

Basic (250 moneditas):
- 175 textos x 1 = 175
- 17 imagenes x 3 = 51
- 12 audios x 2 = 24
= 250 moneditas

Premium (800 moneditas):
- 560 textos x 1 = 560
- 53 imagenes x 3 = 159
- 40 audios x 2 = 80
= ~800 moneditas
```

---

## Analisis de Rentabilidad

### Costo por Usuario por Plan

#### Plan Free ($0)

| Concepto | Cantidad | Costo Unitario | Total |
|----------|----------|----------------|-------|
| Moneditas usadas (promedio 80%) | 40 | ~$0.007* | $0.28 |
| Resumenes semanales | 4 | $0.009 | $0.036 |
| **TOTAL** | | | **~$0.32/mes** |

*Promedio ponderado considerando mix de operaciones

#### Plan Basic ($2.99)

| Concepto | Cantidad | Costo Unitario | Total |
|----------|----------|----------------|-------|
| Moneditas usadas (promedio 85%) | 212 | ~$0.007 | $1.48 |
| Resumenes semanales | 4 | $0.009 | $0.036 |
| **TOTAL COSTO** | | | **~$1.52/mes** |
| **INGRESO** | | | **$2.99** |
| **MARGEN** | | | **$1.47 (49%)** |

#### Plan Premium ($7.99)

| Concepto | Cantidad | Costo Unitario | Total |
|----------|----------|----------------|-------|
| Moneditas usadas (promedio 90%) | 720 | ~$0.007 | $5.04 |
| Resumenes semanales | 4 | $0.009 | $0.036 |
| **TOTAL COSTO** | | | **~$5.08/mes** |
| **INGRESO** | | | **$7.99** |
| **MARGEN** | | | **$2.91 (36%)** |

### Resumen de Margenes

| Plan | Precio | Costo API | Comisión Wompi* | **Margen Real** | **Margen %** |
|------|--------|-----------|-----------------|-----------------|--------------|
| **Free** | $0 | $0.32 | $0 | -$0.32 | N/A |
| **Basic** | $2.99 | $1.52 | $0.37 | **+$1.10** | **37%** |
| **Premium** | $7.99 | $5.08 | $0.54 | **+$2.37** | **30%** |

*Comisión Wompi asume pago con tarjeta (2.9% + $900 COP + IVA). Ver sección "Comisiones del Procesador de Pagos" para detalles.

> Nota: Margenes mas conservadores que el modelo anterior debido a:
> 1. Resumen semanal para todos (incluyendo Free)
> 2. Mas moneditas por plan para mejor UX
> 3. Estimacion de uso mas alta (usuarios mas engaged)

---

## Escenarios de Usuarios

### Distribucion Esperada

| Escenario | Free | Basic | Premium | Total |
|-----------|------|-------|---------|-------|
| **100 usuarios** | 75 (75%) | 18 (18%) | 7 (7%) | 100 |
| **500 usuarios** | 350 (70%) | 110 (22%) | 40 (8%) | 500 |
| **2000 usuarios** | 1300 (65%) | 500 (25%) | 200 (10%) | 2000 |

### Escenario 1: 100 Usuarios

#### Ingresos (Neto después de Wompi)

| Plan | Precio/mes | Usuarios | % | Precio Bruto | Comisión Wompi | **Ingreso Neto** |
|------|------------|----------|---|--------------|----------------|------------------|
| Free | $0 | 75 | 75% | $0 | $0 | $0 |
| Basic | $2.99 | 18 | 18% | $53.82 | $6.66 | $47.16 |
| Premium | $7.99 | 7 | 7% | $55.93 | $3.78 | $52.15 |
| **TOTAL** | | **100** | 100% | $109.75 | $10.44 | **$99.31** |

#### Costos

| Tipo | Concepto | Costo |
|------|----------|-------|
| **FIJOS** | Railway | $5.00 |
| | Supabase | $0.00 |
| | Dominio ($15/año) | $1.25 |
| | **Subtotal Fijos** | **$6.25** |
| **VARIABLES** | Free (75 × $0.32) | $24.00 |
| | Basic (18 × $1.52) | $27.36 |
| | Premium (7 × $5.08) | $35.56 |
| | Wompi (25 pagos × $0.40) | $10.00 |
| | **Subtotal Variables** | **$96.92** |
| **TOTAL** | | **$103.17** |

#### Resultado

| Metrica | Valor |
|---------|-------|
| Ingreso bruto | $109.75 |
| Costos fijos | -$6.25 |
| Costos variables (API + Wompi) | -$96.92 |
| **Ganancia** | **+$6.58** |
| **Margen** | **6%** |

> Con costos fijos bajos ($6.25), 100 usuarios ya genera ganancia.

### Escenario 2: 500 Usuarios

#### Ingresos (Neto después de Wompi)

| Plan | Precio/mes | Usuarios | % | Precio Bruto | Comisión Wompi | **Ingreso Neto** |
|------|------------|----------|---|--------------|----------------|------------------|
| Free | $0 | 350 | 70% | $0 | $0 | $0 |
| Basic | $2.99 | 110 | 22% | $328.90 | $40.70 | $288.20 |
| Premium | $7.99 | 40 | 8% | $319.60 | $21.60 | $298.00 |
| **TOTAL** | | **500** | 100% | $648.50 | $62.30 | **$586.20** |

#### Costos

| Tipo | Concepto | Costo |
|------|----------|-------|
| **FIJOS** | Railway | $20.00 |
| | Supabase | $25.00 |
| | Dominio ($15/año) | $1.25 |
| | **Subtotal Fijos** | **$46.25** |
| **VARIABLES** | Free (350 × $0.32) | $112.00 |
| | Basic (110 × $1.52) | $167.20 |
| | Premium (40 × $5.08) | $203.20 |
| | Wompi (150 pagos × $0.42) | $63.00 |
| | **Subtotal Variables** | **$545.40** |
| **TOTAL** | | **$591.65** |

#### Resultado

| Metrica | Valor |
|---------|-------|
| Ingreso bruto | $648.50 |
| Costos fijos | -$46.25 |
| Costos variables (API + Wompi) | -$545.40 |
| **Ganancia** | **+$56.85** |
| **Margen** | **9%** |

### Escenario 3: 2000 Usuarios

#### Ingresos (Neto después de Wompi)

| Plan | Precio/mes | Usuarios | % | Precio Bruto | Comisión Wompi | **Ingreso Neto** |
|------|------------|----------|---|--------------|----------------|------------------|
| Free | $0 | 1300 | 65% | $0 | $0 | $0 |
| Basic | $2.99 | 500 | 25% | $1,495.00 | $185.00 | $1,310.00 |
| Premium | $7.99 | 200 | 10% | $1,598.00 | $108.00 | $1,490.00 |
| **TOTAL** | | **2000** | 100% | $3,093.00 | $293.00 | **$2,800.00** |

#### Costos

| Tipo | Concepto | Costo |
|------|----------|-------|
| **FIJOS** | Railway | $50.00 |
| | Supabase | $50.00 |
| | Dominio ($15/año) | $1.25 |
| | **Subtotal Fijos** | **$101.25** |
| **VARIABLES** | Free (1300 × $0.32) | $416.00 |
| | Basic (500 × $1.52) | $760.00 |
| | Premium (200 × $5.08) | $1,016.00 |
| | Wompi (700 pagos × $0.42) | $294.00 |
| | **Subtotal Variables** | **$2,486.00** |
| **TOTAL** | | **$2,587.25** |

#### Resultado

| Metrica | Valor |
|---------|-------|
| Ingreso bruto | $3,093.00 |
| Costos fijos | -$101.25 |
| Costos variables (API + Wompi) | -$2,486.00 |
| **Ganancia** | **+$505.75** |
| **Margen** | **16%** |

---

## Comisiones del Procesador de Pagos (Wompi)

### Tarifas de Wompi Colombia (Febrero 2026)

| Método de Pago | Comisión | Fijo |
|----------------|----------|------|
| **Tarjeta crédito/débito** | 2.9% | + $900 COP |
| **PSE (transferencia)** | 0% | $2,500 COP |
| **Nequi** | 2.5% | $0 |
| **Bancolombia QR** | 1.5% | $0 |

> Nota: IVA del 19% aplica sobre la comisión de Wompi

### Impacto por Plan (Pago con Tarjeta)

| Plan | Precio COP | Comisión (2.9% + $900) | IVA (19%) | **Neto Recibido** |
|------|------------|------------------------|-----------|-------------------|
| **Basic** | $12,000 | $1,248 | $237 | **$10,515** |
| **Premium** | $32,000 | $1,828 | $347 | **$29,825** |

### Impacto por Plan (Pago con PSE)

| Plan | Precio COP | Comisión Fija | IVA (19%) | **Neto Recibido** |
|------|------------|---------------|-----------|-------------------|
| **Basic** | $12,000 | $2,500 | $475 | **$9,025** |
| **Premium** | $32,000 | $2,500 | $475 | **$29,025** |

### Margen Real Ajustado (con Wompi)

Usando tarjeta como método más común (~80% de pagos):

#### Plan Basic ($2.99 / $12,000 COP)

| Concepto | Valor |
|----------|-------|
| Precio bruto | $12,000 COP (~$2.99 USD) |
| Comisión Wompi + IVA | -$1,485 COP (~$0.37 USD) |
| **Ingreso neto** | **$10,515 COP (~$2.62 USD)** |
| Costo APIs (moneditas) | -$1.52 USD |
| **Margen real** | **$1.10 USD (37%)** |

#### Plan Premium ($7.99 / $32,000 COP)

| Concepto | Valor |
|----------|-------|
| Precio bruto | $32,000 COP (~$7.99 USD) |
| Comisión Wompi + IVA | -$2,175 COP (~$0.54 USD) |
| **Ingreso neto** | **$29,825 COP (~$7.45 USD)** |
| Costo APIs (moneditas) | -$5.08 USD |
| **Margen real** | **$2.37 USD (30%)** |

### Comparación: Margen Bruto vs Margen Real

| Plan | Margen sin Wompi | Margen con Wompi | Diferencia |
|------|------------------|------------------|------------|
| **Basic** | $1.47 (49%) | $1.10 (37%) | -$0.37 (-12pp) |
| **Premium** | $2.91 (36%) | $2.37 (30%) | -$0.54 (-6pp) |

> **Importante**: Los escenarios de rentabilidad en este documento usan márgenes brutos.
> Para cálculos reales, restar ~12% adicional del ingreso por comisiones de pago.

---

## Costos de Infraestructura

### Costos Fijos vs Variables

| Tipo | Descripcion | Ejemplo |
|------|-------------|---------|
| **Fijo** | No cambia con cantidad de usuarios | Hosting, dominio |
| **Variable** | Cambia por cada operacion/usuario | APIs (Claude, WhatsApp), Wompi |

### Costos Fijos por Escala

| Usuarios | Railway | Supabase | Dominio | **Total Fijo** |
|----------|---------|----------|---------|----------------|
| Actual | $5 | $0 (free) | $1.25 | **$6.25** |
| 100 | $5 | $0 (free) | $1.25 | **$6.25** |
| 500 | $20 | $25 | $1.25 | **$46.25** |
| 2000 | $50 | $50 | $1.25 | **$101.25** |

> Nota: Dominio = $15/año = $1.25/mes. Sin monitoring (Sentry) por ahora.

### Detalle de Servicios Actuales

| Servicio | Costo Actual | Escala | Notas |
|----------|--------------|--------|-------|
| **Railway** | $5/mes | $20+ con trafico | Hosting Node.js |
| **Supabase** | $0 (free) | $25/mes >500 MAU | Base de datos |
| **Dominio** | $1.25/mes | Fijo | $15/año |
| **Monitoring** | $0 | - | No usando Sentry |

### Costos Variables por Operacion

| Operacion | Costo | Moneditas | Servicio |
|-----------|-------|-----------|----------|
| Mensaje texto | $0.009 | 1 | Claude API |
| Imagen/recibo | $0.010 | 3 | Claude Vision |
| Audio | $0.004 | 2 | Groq Whisper |
| Resumen semanal | $0.009 | 2 | Claude API |
| WhatsApp saliente | $0.001 | - | Meta API |

### Costos Variables por Usuario/Mes

| Plan | Costo API |
|------|-----------|
| Free (50 moneditas) | $0.32 |
| Basic (250 moneditas) | $1.52 |
| Premium (800 moneditas) | $5.08 |

### Comisiones Wompi (Variable por transaccion)

| Metodo | Comision | Fijo |
|--------|----------|------|
| Tarjeta credito/debito | 2.9% + IVA | $900 COP |
| PSE | 0% + IVA | $2,500 COP |
| Nequi | 2.5% + IVA | $0 |
| Bancolombia QR | 1.5% + IVA | $0 |

| Plan | Precio | Comision Wompi | Te queda |
|------|--------|----------------|----------|
| Basic | $12,000 COP | ~$1,485 COP | $10,515 COP |
| Premium | $32,000 COP | ~$2,175 COP | $29,825 COP |

---

## Estrategias y Recomendaciones

### Optimizacion de Costos

1. **Prompt Caching** - Anthropic cachea system prompts automaticamente (~90% ahorro en tokens repetidos)
2. **Batch API** - 50% descuento para operaciones no urgentes (resumenes)
3. **Groq como primario** - Whisper gratis vs $0.006/min de OpenAI
4. **Compresion de imagenes** - Redimensionar a 800px max antes de Vision

### Metricas Clave a Monitorear

```javascript
// Agregar a usageMonitor.js
- moneditas_consumed_daily
- moneditas_by_operation_type
- conversion_rate_free_to_paid
- churn_rate_by_plan
- cost_per_active_user
```

### Politicas Sugeridas

1. **Rollover parcial**: 20% de moneditas no usadas pasan al siguiente mes (max 50)
2. **Usuarios inactivos**: Pausar resumenes semanales despues de 3 meses sin actividad
3. **Alerta de moneditas bajas**: Notificar cuando quedan <10 moneditas
4. **Bonus por referidos**: +30 moneditas por cada amigo que se registre

### Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|--------------|---------|------------|
| Usuarios Free no convierten | Media | Alto | Mejorar onboarding, mostrar valor de Premium |
| Abuso de imagenes 4K | Baja | Medio | Comprimir antes de procesar |
| Spike de costos WhatsApp | Baja | Bajo | Colombia tiene tarifas muy bajas |
| Claude API price increase | Media | Alto | Prompt caching, considerar Haiku para tareas simples |

---

## Punto de Equilibrio

### Usuarios Minimos para Rentabilidad

Con costos fijos actuales de ~$6.25/mes (Railway $5 + Dominio $1.25):

| Escenario | Usuarios Pagos Necesarios |
|-----------|---------------------------|
| 100% Basic | ~6 usuarios Basic |
| 100% Premium | ~3 usuarios Premium |
| Mix 70/30 Basic/Premium | ~5 usuarios pagos |
| **Realista (22% Basic, 8% Premium)** | **~15 usuarios totales** |

> Con costos fijos bajos, el break-even es muy accesible. Al escalar a 500+ usuarios, Supabase ($25) aumenta los fijos.

### Formula de Break-even

```
Break-even usuarios = Costos Fijos / (ARPU Neto - Costo Variable por Usuario)

Escenario Inicial (100 usuarios):
- Costos Fijos = $6.25/mes
- ARPU Bruto = $1.10 (con 75% free, 18% basic, 7% premium)
- Comisión Wompi = ~$0.10/usuario
- ARPU Neto = $1.00
- Costo Variable = $0.97/usuario promedio

Break-even = $6.25 / ($1.00 - $0.97) = ~208 usuarios para profit

Pero como ya tienes margen positivo desde ~50 usuarios con tu mix actual.
```

### Resumen de Costos

| Escala | Fijos | Variables | Total | Ingreso | Ganancia |
|--------|-------|-----------|-------|---------|----------|
| **100 usuarios** | $6.25 | $96.92 | $103 | $110 | **+$7** |
| **500 usuarios** | $46.25 | $545.40 | $592 | $649 | **+$57** |

---

## Comparacion: Sistema Anterior vs Nuevo

| Metrica | Limites Separados | Moneditas |
|---------|-------------------|-----------|
| **Complejidad para usuario** | Alta (5 contadores) | Baja (1 contador) |
| **Margen Basic** | ~63% | ~49% |
| **Margen Premium** | ~68% | ~36% |
| **Costo Free user** | $0.27/mes | $0.32/mes |
| **Valor percibido Free** | Bajo | Alto |
| **Conversion esperada** | 10-15% | 20-30% |
| **Retencion esperada** | Media | Alta |

### Por que Margenes Menores son OK

1. **Mayor conversion** compensa menor margen por usuario
2. **Mejor retencion** = mayor LTV (lifetime value)
3. **Resumen semanal** es marketing gratis (engagement)
4. **Usuarios Free felices** = mejor word-of-mouth

---

## Fuentes

- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [WhatsApp Business API Pricing Colombia](https://www.heltar.com/blogs/whatsapp-api-pricing-in-columbia-2025-cm73iygsn0080r1l2vyv39xpd)
- [WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing)
- [Groq Pricing](https://groq.com/pricing)
- [Supabase Pricing](https://supabase.com/pricing)
- [Wompi Tarifas Colombia](https://wompi.com/es/co/tarifas)

---

*Este analisis esta basado en precios de APIs de Febrero 2026 y patrones de uso estimados. Los costos reales pueden variar segun comportamiento de usuarios y cambios en pricing de APIs.*
