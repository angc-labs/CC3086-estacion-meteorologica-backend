import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!    // aquí el anon key SÍ es suficiente
);

export async function GET() {
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}
