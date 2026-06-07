import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const hasCredentials = !!(clientId && clientSecret);

  let apiWorks = false;
  let errorDetail = "";

  if (hasCredentials) {
    try {
      const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${creds}`,
        },
        body: "grant_type=client_credentials",
        cache: "no-store",
      });
      apiWorks = res.ok;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        errorDetail = body?.error_description ?? `HTTP ${res.status}`;
      }
    } catch (e) {
      errorDetail = e instanceof Error ? e.message : "Network error";
    }
  }

  const kvConfigured = !!(process.env.KV_REST_API_URL);

  return NextResponse.json({
    hasCredentials,
    apiWorks,
    errorDetail,
    kvConfigured,
    checkedAt: new Date().toISOString(),
  });
}
