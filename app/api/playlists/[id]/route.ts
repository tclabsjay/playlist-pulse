import { NextRequest, NextResponse } from "next/server";
import { findById, removePlaylist } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const playlist = await findById(id);
  if (!playlist) {
    return NextResponse.json({ message: "Playlist not found." }, { status: 404 });
  }

  await removePlaylist(id);
  return NextResponse.json({ message: "Playlist removed." });
}
