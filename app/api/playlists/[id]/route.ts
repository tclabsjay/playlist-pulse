import { NextRequest, NextResponse } from "next/server";
import { findById, removePlaylist } from "@/lib/storage";

export const dynamic = "force-dynamic";

const ADMIN_PIN = "pulse2025";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { pin?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ignore parse errors
  }

  if (!body.pin || body.pin !== ADMIN_PIN) {
    return NextResponse.json({ message: "Incorrect admin PIN." }, { status: 403 });
  }

  const playlist = await findById(id);
  if (!playlist) {
    return NextResponse.json({ message: "Playlist not found." }, { status: 404 });
  }

  await removePlaylist(id);
  return NextResponse.json({ message: "Playlist removed." });
}
