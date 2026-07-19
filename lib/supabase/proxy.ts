import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "@/lib/supabase/fetch";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute =
    pathname.startsWith("/app") ||
    pathname.startsWith("/pending") ||
    pathname.startsWith("/update-password");

  // Public pages do not need an auth refresh. In particular, refreshing a
  // stale session while the sign-in form is replacing it can cause
  // AuthRefreshDiscardedError in the browser during development.
  if (!protectedRoute) {
    return NextResponse.next({ request });
  }

  // Server Actions and other mutations perform their own authorization. A
  // redirect from Proxy during a Server Action POST is not a valid action
  // response and causes React to report "An unexpected response was received
  // from the server" instead of allowing the action to return its own result.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  let isAuthenticated = false;

  try {
    // Verify the freshly written session with Supabase Auth. getClaims() can
    // reject an otherwise valid new session while its signing-key metadata is
    // unavailable or stale, which creates an /app -> /sign-in redirect loop.
    const { data, error } = await supabase.auth.getUser();
    isAuthenticated = !error && Boolean(data.user);
  } catch {
    // Treat network and stale-session failures as unauthenticated. Public auth
    // routes remain available so the user can replace the session.
    isAuthenticated = false;
  }
  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
