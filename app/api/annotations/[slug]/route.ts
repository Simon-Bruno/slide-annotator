import { NextRequest, NextResponse } from "next/server";
import { loadAnnotations, loadDeckMetadata } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const metadata = await loadDeckMetadata(slug);
    const annotations = await loadAnnotations(slug);
    return NextResponse.json({
      status: metadata.status,
      annotations,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
