import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { findById, removePlaylist } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const { pin } = body;
  if (!pin) {
    return NextResponse.json({ message: "PIN is required." }, { status: 400 });
  }

  const playlist = await findById(id);
  if (!playlist) {
    return NextResponse.json({ message: "Playlist not found." }, { status: 404 });
  }

  const pinHash = createHash("sha256").update(pin).digest("hex");
  if (playlist.pinHash !== pinHash) {
    return NextResponse.json({ message: "Incorrect PIN." }, { status: 403 });
  }

  await removePlaylist(id);
  return NextResponse.json({ message: "Playlist removed." });
}
