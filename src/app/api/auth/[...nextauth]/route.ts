// Explicitly set Node.js runtime for auth handlers
export const runtime = 'nodejs';

// Dynamically import the auth module at request time. This prevents
// bundlers from collapsing or minifying handler references into a
// shape that breaks in Vercel's serverless runtime ("a8 is not a constructor").
// The dynamic import ensures the module is loaded in the function
// runtime and preserves correct constructor/function shapes.

export async function GET(request: Request) {
	try {
		const mod = await import('@/auth');
		if (typeof mod.GET === 'function') {
			return await mod.GET(request as any, undefined);
		}
		throw new Error('Auth GET handler not found');
	} catch (err) {
		console.error('[Dynamic Auth GET] Error:', err);
		throw err;
	}
}

export async function POST(request: Request) {
	try {
		const mod = await import('@/auth');
		if (typeof mod.POST === 'function') {
			return await mod.POST(request as any, undefined);
		}
		throw new Error('Auth POST handler not found');
	} catch (err) {
		console.error('[Dynamic Auth POST] Error:', err);
		throw err;
	}
}
