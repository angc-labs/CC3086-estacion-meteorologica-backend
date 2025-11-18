import { NextResponse } from "next/server";

// Mock data para desarrollo
const mockReadings = [
  {
    id: "1",
    timestamp: new Date().toISOString(),
    ppm_alcohol: 45.2,
    ppm_h2: 12.5,
    ppm_co: 8.3,
    ppm_propano: 22.1,
    ppm_ch4: 15.7,
    lux: 350.5,
    temp_bmp: 25.3,
    pres: 101325,
    alt: 1520,
    hum: 65.2,
    temp_dht: 25.1,
    lluvia: false,
    open: false,
    air_quality: 78,
    rain_intensity: "Sin lluvia",
    is_day: true,
    anomaly: false,
    alerts: ""
  },
  {
    id: "2", 
    timestamp: new Date(Date.now() - 60000).toISOString(),
    ppm_alcohol: 42.8,
    ppm_h2: 11.9,
    ppm_co: 7.8,
    ppm_propano: 21.5,
    ppm_ch4: 14.9,
    lux: 320.1,
    temp_bmp: 25.1,
    pres: 101315,
    alt: 1518,
    hum: 64.8,
    temp_dht: 24.9,
    lluvia: false,
    open: true,
    air_quality: 82,
    rain_intensity: "Sin lluvia",
    is_day: true,
    anomaly: false,
    alerts: ""
  }
];

export async function POST(req: Request) {
  try {
    // En desarrollo, simular éxito
    console.log("Datos recibidos (simulado):", await req.json());
    return NextResponse.json({ ok: true, message: "Datos guardados (modo desarrollo)" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // En desarrollo, retornar datos de ejemplo
    return NextResponse.json(mockReadings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error obteniendo lecturas" }, { status: 500 });
  }
}
