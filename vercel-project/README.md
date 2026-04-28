# VIX Trading Simulator - Vercel Ready 🚀

Simulador de trading en tiempo real con datos auténticos del VIX e índice S&P 500. **Deployable en Vercel sin necesidad de configuración.**

## ✨ Características

✅ Datos reales de Yahoo Finance en tiempo real
✅ 10 años de histórico completo
✅ Múltiples timeframes (1 mes, 3 meses, 1 año, 10 años)
✅ Gráficos interactivos con Recharts
✅ Señales de trading automáticas basadas en VIX
✅ Portfolio simulator
✅ API caché para optimizar performance
✅ Sin requiere configuración manual

## 🚀 Deployment en Vercel (Recomendado)

### Opción 1: Deploy directo desde GitHub (Recomendado)

1. **Fork o copia este repositorio**
   ```bash
   git clone <tu-repo>
   cd vix-trading-simulator
   ```

2. **Sube a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario>/vix-trading-simulator.git
   git push -u origin main
   ```

3. **Abre https://vercel.com**
   - Click en "New Project"
   - Selecciona tu repositorio de GitHub
   - Click en "Import"
   - Click en "Deploy"

**¡Listo! Tu app está en vivo en `https://<tu-proyecto>.vercel.app`**

### Opción 2: Deploy desde CLI

```bash
# Instala Vercel CLI
npm i -g vercel

# Desde la carpeta del proyecto
vercel
```

Sigue las instrucciones interactivas.

## 🏃 Ejecución Local

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev

# Abre http://localhost:3000
```

## 📋 Requisitos

- Node.js 18+ (automático en Vercel)
- npm (automático en Vercel)

## 📡 API Endpoints

### `/api/vix` - Datos actuales del VIX
```bash
curl https://<tu-proyecto>.vercel.app/api/vix
```

### `/api/spy` - Datos actuales de SPY
```bash
curl https://<tu-proyecto>.vercel.app/api/spy
```

### `/api/history` - Datos históricos combinados
```bash
curl https://<tu-proyecto>.vercel.app/api/history?range=10y
```

## 🔧 Variables de Entorno

No se requieren variables de entorno. Los endpoints usan Yahoo Finance directamente.

## 📊 Timeframes Soportados

- **1 Mes** - Análisis corto plazo
- **3 Meses** - Visión por defecto
- **1 Año** - Tendencia anual
- **10 Años** - Histórico completo

## 🎯 Estrategias Implementadas

| VIX | Señal | Estrategia |
|---|---|---|
| **< 20** | COMPRA FUERTE | Long SPY |
| **20-30** | NEUTRAL | Iron Condor |
| **> 35** | VENTA FUERTE | Venta de volatilidad |

## 🐛 Troubleshooting

### "API Error"
- Vercel está haciendo caché de respuestas por 1 hora
- Espera 60 segundos y recarga

### "No hay datos"
- Primera carga descarga 10 años de datos (puede tomar 10-30 segundos)
- Verifica conexión a internet

### "Gráficos vacíos"
- Recarga la página (Cmd+Shift+R en Mac, Ctrl+Shift+R en Windows)
- Limpia caché del navegador

## 📚 Tech Stack

- **Frontend**: Next.js 14, React 18, Recharts, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, Axios
- **Hosting**: Vercel (Serverless)
- **Data**: Yahoo Finance API

## 📝 Licencia

MIT

## 👨‍💻 Autor

Desarrollado como herramienta educativa de análisis técnico.

## ⚠️ Disclaimer

Este simulador es **SOLO para propósitos educativos**. No es asesoramiento financiero. Los datos pueden tener retrasos. Realiza tus propias investigaciones antes de cualquier decisión de trading.

---

**¿Preguntas?** Abre un issue en GitHub o contacta al autor.

**Hecho con ❤️ para traders educativos**
