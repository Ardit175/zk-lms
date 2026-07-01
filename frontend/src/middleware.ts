import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/', '/login', '/register', '/courses'];
const roleRoutes: Record<string, string[]> = {
  ADMIN: ['/admin'],
  INSTRUCTOR: ['/instructor'],
  STUDENT: ['/student'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith('/courses/'))) {
    return NextResponse.next();
  }

  // Check for auth token in cookies (set by client)
  const token = request.cookies.get('eduai-token')?.value;
  const userCookie = request.cookies.get('eduai-user')?.value;

  // If no token and trying to access protected route, redirect to login
  if (!token && (pathname.startsWith('/admin') || pathname.startsWith('/instructor') || pathname.startsWith('/student'))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If we have user info, check role-based access
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      const userRole = user.role as string;

      // Check if user is accessing the correct role routes
      for (const [role, routes] of Object.entries(roleRoutes)) {
        for (const route of routes) {
          if (pathname.startsWith(route) && userRole !== role) {
            // Redirect to their correct dashboard
            const correctDashboard = getRedirectPath(userRole);
            return NextResponse.redirect(new URL(correctDashboard, request.url));
          }
        }
      }
    } catch {
      // Invalid user cookie, continue (client will handle auth)
    }
  }

  return NextResponse.next();
}

function getRedirectPath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'INSTRUCTOR':
      return '/instructor/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    default:
      return '/';
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|health).*)',
  ],
};
