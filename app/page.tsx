"use client";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

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

  function updateState() {
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, open })
    });
  }

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
    </div>
  );
}