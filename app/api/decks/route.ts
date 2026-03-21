import { NextResponse } from "next/server";
import { listDecks } from "@/lib/storage";

export async function GET() {
  const decks = await listDecks();
  return NextResponse.json(decks);
}
