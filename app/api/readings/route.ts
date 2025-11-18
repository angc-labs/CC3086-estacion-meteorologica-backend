import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
        ppm_alcohol,
        ppm_h2,
        ppm_co,
        ppm_propano,
        ppm_ch4,
        lux,
        temp_bmp,
        pres,
        alt,
        hum,
        temp_dht,
        lluvia,
        open,
        latitude,
        longitude,
        accuracy
    } = body;

    const { error } = await supabase.from("readings").insert({
        ppm_alcohol,
        ppm_h2,
        ppm_co,
        ppm_propano,
        ppm_ch4,
        lux,
        temp_bmp,
        pres,
        alt,
        hum,
        temp_dht,
        lluvia,
        open,
        latitude,
        longitude,
        accuracy
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(1000);

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

