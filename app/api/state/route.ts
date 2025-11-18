import { NextResponse } from "next/server";

// Estado mock para desarrollo
let currentState = {
  id: 1,
  text: "Sistema de monitoreo activo",
  open: false
};

export async function GET() {
  try {
    return NextResponse.json(currentState);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error obteniendo estado" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, open } = body;

    // Actualizar estado mock
    currentState = {
      ...currentState,
      text: text ?? currentState.text,
      open: open ?? currentState.open
    };

    console.log("Estado actualizado:", currentState);
    return NextResponse.json(currentState);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error actualizando estado" }, { status: 500 });
  }
}