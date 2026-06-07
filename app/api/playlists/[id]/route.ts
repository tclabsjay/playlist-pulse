import { NextRequest, NextResponse } from "next/server";
import { findById, removePlaylist } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // If ADMIN_PIN env var is set, require it to delete
  const adminPin = process.env.ADMIN_PIN;
  if (adminPin) {
    let body: { pin?: string } = {};
    try {
      body = await req.json();
    } catch {
      // body is optional if no PIN required
    }
    if (!body.pin || body.pin !== adminPin) {
      return NextResponse.json({ message: "Incorrect admin PIN." }, { status: 403 });
    }
  }

  const playlist = await findById(id);
  if (!playlist) {
    return NextResponse.json({ message: "Playlist not found." }, { status: 404 });
  }

  await removePlaylist(id);
  return NextResponse.json({ message: "Playlist removed." });
}
