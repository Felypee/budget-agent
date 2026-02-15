# Monedita - Sistema de Pricing con Tokens ("Moneditas")

> Ultima actualizacion: Febrero 2026

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

| Plan | Precio | Costo Max | Margen | Margen % |
|------|--------|-----------|--------|----------|
| **Free** | $0 | $0.32 | -$0.32 | N/A |
| **Basic** | $2.99 | $1.52 | +$1.47 | 49% |
| **Premium** | $7.99 | $5.08 | +$2.91 | 36% |

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

#### Ingresos

| Plan | Usuarios | Precio | Mensual |
|------|----------|--------|---------|
| Free | 75 | $0 | $0 |
| Basic | 18 | $2.99 | $53.82 |
| Premium | 7 | $7.99 | $55.93 |
| **TOTAL** | **100** | | **$109.75** |

#### Costos

| Plan | Usuarios | Costo/Usuario | Mensual |
|------|----------|---------------|---------|
| Free | 75 | $0.32 | $24.00 |
| Basic | 18 | $1.52 | $27.36 |
| Premium | 7 | $5.08 | $35.56 |
| **API Total** | | | **$86.92** |
| **Infraestructura** | | | **$15.00** |
| **TOTAL COSTOS** | | | **$101.92** |

#### Resultado

| Metrica | Valor |
|---------|-------|
| Ingreso | $109.75 |
| Costos | $101.92 |
| **Ganancia** | **$7.83** |
| **Margen** | **7.1%** |

### Escenario 2: 500 Usuarios

#### Ingresos

| Plan | Usuarios | Precio | Mensual |
|------|----------|--------|---------|
| Free | 350 | $0 | $0 |
| Basic | 110 | $2.99 | $328.90 |
| Premium | 40 | $7.99 | $319.60 |
| **TOTAL** | **500** | | **$648.50** |

#### Costos

| Plan | Usuarios | Costo/Usuario | Mensual |
|------|----------|---------------|---------|
| Free | 350 | $0.32 | $112.00 |
| Basic | 110 | $1.52 | $167.20 |
| Premium | 40 | $5.08 | $203.20 |
| **API Total** | | | **$482.40** |
| **Infraestructura** | | | **$50.00** |
| **TOTAL COSTOS** | | | **$532.40** |

#### Resultado

| Metrica | Valor |
|---------|-------|
| Ingreso | $648.50 |
| Costos | $532.40 |
| **Ganancia** | **$116.10** |
| **Margen** | **17.9%** |

### Escenario 3: 2000 Usuarios

#### Ingresos

| Plan | Usuarios | Precio | Mensual |
|------|----------|--------|---------|
| Free | 1300 | $0 | $0 |
| Basic | 500 | $2.99 | $1,495.00 |
| Premium | 200 | $7.99 | $1,598.00 |
| **TOTAL** | **2000** | | **$3,093.00** |

#### Costos

| Plan | Usuarios | Costo/Usuario | Mensual |
|------|----------|---------------|---------|
| Free | 1300 | $0.32 | $416.00 |
| Basic | 500 | $1.52 | $760.00 |
| Premium | 200 | $5.08 | $1,016.00 |
| **API Total** | | | **$2,192.00** |
| **Infraestructura** | | | **$150.00** |
| **TOTAL COSTOS** | | | **$2,342.00** |

#### Resultado

| Metrica | Valor |
|---------|-------|
| Ingreso | $3,093.00 |
| Costos | $2,342.00 |
| **Ganancia** | **$751.00** |
| **Margen** | **24.3%** |

---

## Costos de Infraestructura

### Por Escala

| Usuarios | Hosting | Base de Datos | Dominio | Monitoring | Total |
|----------|---------|---------------|---------|------------|-------|
| 100 | $7 | $0 (free) | $1 | $5 | **$13** |
| 500 | $20 | $25 | $1 | $10 | **$56** |
| 2000 | $50 | $50 | $1 | $25 | **$126** |
| 5000 | $100 | $100 | $1 | $50 | **$251** |

### Detalle de Servicios

| Servicio | Free Tier | Pro | Notas |
|----------|-----------|-----|-------|
| **Railway/Render** | $0-5 | $20+ | Hosting Node.js |
| **Supabase** | 500MB, 50k MAU | $25/mes | Base de datos |
| **Vercel** | 100GB BW | $20/mes | Landing + pagina visual |
| **Sentry/LogRocket** | Limitado | $26/mes | Monitoring |

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

Con costos fijos de ~$50/mes (infraestructura basica):

| Escenario | Usuarios Pagos Necesarios |
|-----------|---------------------------|
| 100% Basic | ~34 usuarios Basic |
| 100% Premium | ~17 usuarios Premium |
| Mix 70/30 Basic/Premium | ~25 usuarios pagos |
| **Realista (22% Basic, 8% Premium)** | **~100 usuarios totales** |

### Formula de Break-even

```
Break-even usuarios = Costos Fijos / (ARPU - Costo Variable por Usuario)

Donde:
- Costos Fijos = $50/mes (infraestructura)
- ARPU (Average Revenue Per User) = $1.30 (con 70% free, 22% basic, 8% premium)
- Costo Variable = $0.70/usuario promedio

Break-even = $50 / ($1.30 - $0.70) = ~83 usuarios
```

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

---

*Este analisis esta basado en precios de APIs de Febrero 2026 y patrones de uso estimados. Los costos reales pueden variar segun comportamiento de usuarios y cambios en pricing de APIs.*
