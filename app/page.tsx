"use client";
import { useState, useEffect, useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

export default function Dashboard() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  type Reading = {
    id: string;
    timestamp: string;
    ppm_alcohol: number;
    ppm_h2: number;
    ppm_co: number;
    ppm_propano: number;
    ppm_ch4: number;
  };

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

    return () => {
      isMounted = false;
    };
  }, []);

  function updateState() {
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, open })
    });
  }

  const gasChartConfig: ChartConfig = {
    ppm_alcohol: {
      label: "Alcohol",
      color: "#e66868",
    },
    ppm_h2: {
      label: "H₂",
      color: "#f0b429",
    },
    ppm_co: {
      label: "CO",
      color: "#5ca0d3",
    },
    ppm_propano: {
      label: "Propano",
      color: "#7fc08b",
    },
    ppm_ch4: {
      label: "CH₄",
      color: "#a679e3",
    },
  };

  const gasChartData = useMemo(() => {
    return readings
      .slice()
      .reverse()
      .map((reading) => ({
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

  if (isLoading) {
    return <div style={{ padding: 20 }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Control IoT</h1>

      {/* Key force re-render when data is loaded */}
      <input
        key={dataLoaded ? "loaded" : "loading"}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Texto LCD"
      />

      <button onClick={() => setOpen(!open)}>
        {open ? "Cerrar sistema" : "Abrir sistema"}
      </button>

      <button onClick={updateState}>Enviar</button>

      <section style={{ marginTop: 32 }}>
        <h2>Lecturas de gases (ppm)</h2>
        {isChartLoading ? (
          <p>Cargando gráfica...</p>
        ) : chartError ? (
          <p>{chartError}</p>
        ) : gasChartData.length === 0 ? (
          <p>No hay lecturas disponibles.</p>
        ) : (
          <div style={{ marginTop: 16 }}>
            <ChartContainer
              config={gasChartConfig}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <AreaChart data={gasChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <ChartTooltip
                  cursor={{ stroke: "rgba(0,0,0,0.2)" }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="ppm_alcohol"
                  stackId="gases"
                  stroke="var(--color-ppm_alcohol)"
                  fill="var(--color-ppm_alcohol)"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="ppm_h2"
                  stackId="gases"
                  stroke="var(--color-ppm_h2)"
                  fill="var(--color-ppm_h2)"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="ppm_co"
                  stackId="gases"
                  stroke="var(--color-ppm_co)"
                  fill="var(--color-ppm_co)"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="ppm_propano"
                  stackId="gases"
                  stroke="var(--color-ppm_propano)"
                  fill="var(--color-ppm_propano)"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="ppm_ch4"
                  stackId="gases"
                  stroke="var(--color-ppm_ch4)"
                  fill="var(--color-ppm_ch4)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </section>
    </div>
  );
}