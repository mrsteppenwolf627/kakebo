import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Determine the correct origin for redirects
  const origin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  console.log("[Auth Callback] Starting. Origin:", origin, "Code present:", !!code);

  // Handle OAuth errors from provider
  if (error) {
    console.error("[Auth Callback] OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    // Log all cookies for debugging
    const allCookies = request.cookies.getAll();
    console.log("[Auth Callback] Cookies received:", allCookies.map(c => c.name));

    // Create the redirect response first - cookies will be attached to this
    const redirectUrl = `${origin}/app`;
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            console.log("[Auth Callback] Setting cookies:", cookiesToSet.map(c => c.name));
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Exchange error:", exchangeError.message, exchangeError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    console.log("[Auth Callback] Exchange successful. User:", data.user?.email);
    console.log("[Auth Callback] Redirecting to:", redirectUrl);

    // Return the response with session cookies attached
    return response;
  }

  console.log("[Auth Callback] No code provided, redirecting to login");
  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
