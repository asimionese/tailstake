import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/app";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // For magic link flow (hash-based), serve a client-side handler
  // The hash fragment (#access_token=...) is not visible to the server
  // So we serve an HTML page that reads the hash and completes auth
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Signing in...</title></head>
    <body>
      <p>Signing you in...</p>
      <script>
        // Supabase magic link puts tokens in the hash fragment
        // The @supabase/ssr client picks these up automatically on any page load
        // Just redirect to the app
        const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || '/app';

        // Check for error in hash
        const hash = window.location.hash;
        if (hash.includes('error=')) {
          const params = new URLSearchParams(hash.substring(1));
          const error = params.get('error_description') || params.get('error') || 'Authentication failed';
          window.location.href = '/?error=' + encodeURIComponent(error);
        } else {
          window.location.href = redirectTo;
        }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
