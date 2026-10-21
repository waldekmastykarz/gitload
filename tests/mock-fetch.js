const filePath = 'plugins/code-simplifier/agents/code-simplifier.md';

globalThis.fetch = async (input) => {
  const url = new URL(input);

  if (url.hostname === 'api.github.com') {
    if (url.pathname.startsWith('/repos/waldekmastykarz/lennys-podcast/')) {
      return new Response(null, { status: 404, statusText: 'Not Found' });
    }

    if (url.pathname.includes('/contents/')) {
      return Response.json({ size: 16, sha: 'test-sha' });
    }

    if (url.pathname.endsWith('/git/trees/main')) {
      return Response.json({
        tree: [{ type: 'blob', path: filePath, size: 16, sha: 'test-sha' }]
      });
    }
  }

  if (url.hostname === 'raw.githubusercontent.com') {
    return new Response('fixture contents');
  }

  return new Response(null, { status: 404, statusText: 'Not Found' });
};
