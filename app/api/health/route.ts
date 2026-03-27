export async function GET() {
  return Response.json({
    status: 'healthy',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
  });
}
