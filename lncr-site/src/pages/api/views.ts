import type { APIRoute } from 'astro';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const handleViews: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const isResetRequested =
    url.searchParams.get('reset') === 'true' || url.searchParams.get('reset') === '1';

  try {
    const globalKey = 'lncr_combat_robotics_calculator_v1';
    let targetUrl = `https://countapi.mileshilliard.com/api/v1/hit/${globalKey}`;
    if (isResetRequested) {
      targetUrl = `https://countapi.mileshilliard.com/api/v1/set/${globalKey}?value=1`;
    }

    const remoteRes = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 LNCR-Calculator/1.0' },
    });

    if (remoteRes.ok) {
      const data = (await remoteRes.json()) as { value?: number };
      if (data && typeof data.value === 'number') {
        return new Response(
          JSON.stringify({ count: data.value, source: 'global-shared' }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        );
      }
    }
  } catch {}

  return new Response(JSON.stringify({ count: 67, source: 'fallback' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

export const GET = handleViews;
export const POST = handleViews;
export const OPTIONS: APIRoute = async () => new Response(null, { headers: corsHeaders });
