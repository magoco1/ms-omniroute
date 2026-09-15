var FALLBACK_TARGET = "https://studio-<owner>-<repo>.api-inference.modelscope.ai";
addEventListener("fetch", function (event) { event.respondWith(handle(event.request)); });
function fixFrameHeaders(headers) {
  // Allow the dashboard to render inside the ModelScope Studio page (and any tab):
  // strip DENY and open frame-ancestors. API/JSON responses untouched in behavior.
  headers.delete("X-Frame-Options");
  var csp = headers.get("Content-Security-Policy");
  if (csp) {
    csp = csp.replace(/frame-ancestors[^;]*;?/gi, "");
    headers.set("Content-Security-Policy", csp + ";frame-ancestors 'self' https://www.modelscope.ai https://modelscope.ai https://*.ms.fun;");
  } else {
    headers.set("Content-Security-Policy", "frame-ancestors 'self' https://www.modelscope.ai https://modelscope.ai https://*.ms.fun;");
  }
}
async function handle(req) {
  var url = new URL(req.url);
  var base = (typeof TUNNEL_URL !== "undefined" && TUNNEL_URL ? TUNNEL_URL : "https://<current-tunnel-host>").replace(/\/+$/, "");
  if (!base) return new Response("TUNNEL_URL not configured", { status: 500 });
  var target = base + url.pathname + url.search;
  var headers = new Headers(req.headers);
  try { headers.set("Host", new URL(base).host); } catch (e) {}
  headers.delete("cf-connecting-ip");
  var upstream;
  try {
    upstream = await fetch(target, { method: req.method, headers: headers, body: ["GET", "HEAD"].indexOf(req.method) >= 0 ? undefined : req.body });
  } catch (e) {
    if (typeof MS_TOKEN !== "undefined" && MS_TOKEN) {
      var fb = FALLBACK_TARGET + url.pathname + url.search;
      var h2 = new Headers(req.headers);
      var clientKey = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      h2.set("Authorization", "Bearer " + MS_TOKEN);
      if (clientKey) { h2.set("x-omniroute-key", clientKey); h2.set("x-goog-api-key", clientKey); }
      upstream = await fetch(fb, { method: req.method, headers: h2, body: ["GET", "HEAD"].indexOf(req.method) >= 0 ? undefined : req.body });
    } else {
      return new Response("upstream unavailable", { status: 502 });
    }
  }
  var out = new Headers(upstream.headers);
  fixFrameHeaders(out);
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}
