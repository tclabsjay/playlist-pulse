import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import type { StoredPlaylist } from "../route";

// Re-use the same in-memory store via module reference
// eslint-disable-next-line @typescript-eslint/no-require-imports
const parentModule = require("../route") as { store?: StoredPlaylist[] };

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { pin } = body;
  if (!pin) {
    return NextResponse.json({ message: "PIN is required." }, { status: 400 });
  }

  const store = parentModule.store;
  if (!store) {
    return NextResponse.json({ message: "Storage unavailable." }, { status: 500 });
  }

  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ message: "Playlist not found." }, { status: 404 });
  }

  const pinHash = createHash("sha256").update(pin).digest("hex");
  if (store[idx].pinHash !== pinHash) {
    return NextResponse.json({ message: "Incorrect PIN." }, { status: 403 });
  }

  store.splice(idx, 1);
  return NextResponse.json({ message: "Playlist removed." });
}
