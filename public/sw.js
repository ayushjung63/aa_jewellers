// Network-only: data lives in Postgres, so the only offline job is a friendly page instead of the browser error.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><meta name="viewport" content="width=device-width"><title>Offline</title>' +
            '<body style="font-family:system-ui;background:#fafaf7;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center">' +
            "<div><h1>You're offline</h1><p>Reconnect and pull to refresh.</p></div>",
          { headers: { "Content-Type": "text/html" } },
        ),
    ),
  );
});
