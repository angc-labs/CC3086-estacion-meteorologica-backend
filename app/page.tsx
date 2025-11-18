"use client";
import { useState, useEffect, useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend, 
} from "recharts";
import {
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  CloudRain,
  Sun,
  AlertTriangle,
  Activity,
  Eye,
  Cloud,
  RefreshCw,
  Database,
  AlertCircle,
} from "lucide-react";

// Tipo completo para las lecturas
type Reading = {
  id: string;
  timestamp: string;
  ppm_alcohol: number;
  ppm_h2: number;
  ppm_co: number;
  ppm_propano: number;
  ppm_ch4: number;
  lux: number;
  temp_bmp: number;
  pres: number;
  alt: number;
  hum: number;
  temp_dht: number;
  lluvia: boolean;
  open: boolean;
  // Nuevos campos para el frontend mejorado
  air_quality?: number;
  rain_intensity?: string;
  is_day?: boolean;
  anomaly?: boolean;
  alerts?: string;
};

export default function Dashboard() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    temperature: 0,
    humidity: 0,
    pressure: 0,
    airQuality: 0,
    lightIntensity: 0,
    rainDetected: false,
    anomaly: false,
    alerts: "",
  });

  // Cargar estado del sistema
  useEffect(() => {
    fetch("/api/state")
      .then(r => r.json())
      .then(d => {
        setText(d.text || "");
        setOpen(d.open || false);
        setIsLoading(false);
        setDataLoaded(true);
      });
  }, []);

  // Cargar lecturas y actualizar cada 30 segundos
  useEffect(() => {
    let isMounted = true;

    async function fetchReadings() {
      try {
        setIsChartLoading(true);
        setChartError(null);
        const response = await fetch("/api/readings");
        if (!response.ok) {
          throw new Error("No se pudieron obtener las lecturas");
        }
        const payload = await response.json();
        if (isMounted) {
          setReadings(Array.isArray(payload) ? payload : []);
          setLastUpdate(new Date());
          calculateStats(Array.isArray(payload) ? payload : []);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setChartError("Error cargando lecturas");
        }
      } finally {
        if (isMounted) {
          setIsChartLoading(false);
        }
      }
    }

    fetchReadings();
    const interval = setInterval(fetchReadings, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Calcular estadísticas
  const calculateStats = (readings: Reading[]) => {
    if (readings.length === 0) return;

    const latest = readings[readings.length - 1];
    setStats({
      temperature: latest.temp_dht || latest.temp_bmp || 0,
      humidity: latest.hum || 0,
      pressure: latest.pres ? latest.pres / 100 : 0, // Convertir a hPa
      airQuality: latest.air_quality || calculateAirQuality(latest),
      lightIntensity: latest.lux || 0,
      rainDetected: latest.lluvia || false,
      anomaly: latest.anomaly || false,
      alerts: latest.alerts || "",
    });
  };

  // Calcular calidad del aire basado en gases
  const calculateAirQuality = (reading: Reading): number => {
    const gases = [
      reading.ppm_alcohol,
      reading.ppm_h2,
      reading.ppm_co,
      reading.ppm_propano,
      reading.ppm_ch4
    ];
    
    const maxConcentration = Math.max(...gases.filter(g => !isNaN(g)));
    
    // Escala simple de 0-100 (0=malo, 100=excelente)
    if (maxConcentration > 1000) return 20;
    if (maxConcentration > 500) return 40;
    if (maxConcentration > 100) return 60;
    if (maxConcentration > 50) return 80;
    return 95;
  };

  const updateState = () => {
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, open })
    });
  };

  // Configuración para gráficas
  const gasChartConfig: ChartConfig = {
    ppm_alcohol: { label: "Alcohol", color: "#e66868" },
    ppm_h2: { label: "H₂", color: "#f0b429" },
    ppm_co: { label: "CO", color: "#5ca0d3" },
    ppm_propano: { label: "Propano", color: "#7fc08b" },
    ppm_ch4: { label: "CH₄", color: "#a679e3" },
  };

  const environmentalChartConfig: ChartConfig = {
    temperatura: { label: "Temperatura (°C)", color: "#ef4444" },
    humedad: { label: "Humedad (%)", color: "#3b82f6" },
    presion: { label: "Presión (hPa)", color: "#8b5cf6" },
  };

  // Datos para gráficas
  const gasChartData = useMemo(() => {
    return readings.slice(-20).map((reading) => ({
      timestamp: new Date(reading.timestamp).toLocaleTimeString("es-GT", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ppm_alcohol: reading.ppm_alcohol,
      ppm_h2: reading.ppm_h2,
      ppm_co: reading.ppm_co,
      ppm_propano: reading.ppm_propano,
      ppm_ch4: reading.ppm_ch4,
    }));
  }, [readings]);

  const environmentalChartData = useMemo(() => {
    return readings.slice(-20).map((reading) => ({
      timestamp: new Date(reading.timestamp).toLocaleTimeString("es-GT", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temperatura: reading.temp_dht || reading.temp_bmp,
      humedad: reading.hum,
      presion: reading.pres ? reading.pres / 100 : 0,
    }));
  }, [readings]);

  const lightRainChartData = useMemo(() => {
    return readings.slice(-20).map((reading) => ({
      timestamp: new Date(reading.timestamp).toLocaleTimeString("es-GT", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      lux: reading.lux,
      // CAMBIO: 0 = mojado, por lo tanto invertimos la lógica
      lluvia: reading.lluvia ? 1 : 0, // Ahora 1 significa mojado, 0 significa seco
    }));
  }, [readings]);

  // Datos para gráfica de calidad del aire
  const airQualityData = [
    { name: 'Buena', value: Math.max(0, stats.airQuality - 50) },
    { name: 'Regular', value: Math.max(0, 75 - stats.airQuality) },
    { name: 'Mala', value: Math.max(0, 100 - stats.airQuality) },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Cargando estación meteorológica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Estación Meteorológica CUDA-Clima
            </h1>
            <p className="text-gray-600 mt-2">
              Monitoreo en tiempo real - Procesamiento con CUDA
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </button>
            {lastUpdate && (
              <div className="text-sm text-gray-500">
                Actualizado: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
            <Thermometer className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.temperature.toFixed(1)}°C</div>
            <p className="text-xs text-gray-500">
              {stats.temperature > 30 ? "Caluroso" : stats.temperature < 15 ? "Frío" : "Templado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humedad</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.humidity.toFixed(0)}%</div>
            <p className="text-xs text-gray-500">
              {stats.humidity > 80 ? "Húmedo" : stats.humidity < 30 ? "Seco" : "Normal"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presión</CardTitle>
            <Gauge className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pressure.toFixed(0)} hPa</div>
            <p className="text-xs text-gray-500">
              {stats.pressure > 1020 ? "Alta" : stats.pressure < 1000 ? "Baja" : "Normal"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calidad Aire</CardTitle>
            <Wind className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.airQuality.toFixed(0)}%</div>
            <p className="text-xs text-gray-500">
              {stats.airQuality > 80 ? "Excelente" : stats.airQuality > 60 ? "Buena" : "Regular"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Control del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Mensaje LCD</label>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Ingrese mensaje para display..."
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setOpen(!open)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    open 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {open ? "🔒 Cerrar Sistema" : "🔓 Abrir Sistema"}
                </button>
                <button
                  onClick={updateState}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Enviar Comando
                </button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Estado actual: <span className={open ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {open ? "Sistema ABIERTO" : "Sistema CERRADO"}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Environmental Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-red-500" />
                Temperatura y Humedad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isChartLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : environmentalChartData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No hay datos disponibles
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={environmentalChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="temperatura"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Temperatura (°C)"
                      dot={{ r: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="humedad"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Humedad (%)"
                      dot={{ r: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-green-500" />
                Calidad del Aire - Gases
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isChartLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : gasChartData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No hay datos disponibles
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gasChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Bar dataKey="ppm_alcohol" fill="#e66868" name="Alcohol (ppm)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="ppm_co" fill="#5ca0d3" name="CO (ppm)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="ppm_ch4" fill="#a679e3" name="CH₄ (ppm)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Light and Rain Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                Intensidad Lumínica
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isChartLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : lightRainChartData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No hay datos disponibles
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={lightRainChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="lux" 
                      stroke="#eab308" 
                      fill="#fef08a" 
                      fillOpacity={0.6}
                      name="Intensidad (lux)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-400" />
                Estado de Lluvia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-6xl mb-4 ${stats.rainDetected ? 'text-blue-400' : 'text-yellow-400'}`}>
                  {stats.rainDetected ? '🌧️' : '☀️'}
                </div>
                <p className="text-xl font-semibold">
                  {/* CAMBIO: Invertimos la lógica del texto también */}
                  {stats.rainDetected ? 'Mojado - Lluvia Detectada' : 'Seco - Sin Lluvia'}
                </p>
                <p className="text-gray-500 mt-2">
                  {stats.rainDetected 
                    ? 'Condiciones húmedas - Activar protocolos' 
                    : 'Condiciones secas - Normal'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Air Quality Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-green-500" />
              Indicador de Calidad del Aire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="flex justify-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={airQualityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {airQualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <text 
                      x="50%" 
                      y="50%" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      className="text-2xl font-bold"
                    >
                      {stats.airQuality}%
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Excelente (81-100%)</span>
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium">Buena (61-80%)</span>
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Regular (0-60%)</span>
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                  </div>
                </div>
                {stats.alerts && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Alertas Activas:</span>
                    </div>
                    <p className="text-orange-700 text-sm mt-1">{stats.alerts}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-8 text-center text-gray-500 text-sm">
        <p>Estación Meteorológica Inteligente con Procesamiento CUDA - UVG 2025</p>
        <p>Sistema de monitoreo ambiental en tiempo real</p>
      </div>
    </div>
  );
}
