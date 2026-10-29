/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, MIT License */
let coepCredentialless = false;
if (typeof window === 'undefined') {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener("message", (ev) => {
    if (!ev.data) {
      return;
    }
    if (ev.data.type === "deregister") {
      self.registration
        .unregister()
        .then(() => self.clients.matchAll())
        .then((clients) => {
          clients.forEach((client) => client.navigate(client.url));
        });
    }
  });

  self.addEventListener("fetch", function (event) {
    const request = event.request;
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 0) {
            return response;
          }

          const newHeaders = new Headers(response.headers);
          newHeaders.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
          newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        })
        .catch((e) => console.error(e))
    );
  });
} else {
  (() => {
    const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
    window.sessionStorage.removeItem("coiReloadedBySelf");
    const coepDegraded = reloadedBySelf == "true";

    // You can customize the behavior with window.coi
    const coi = {
      shouldRegister: () => !window.crossOriginIsolated,
      shouldDeregister: () => false,
      coepCredentialless: () => false,
      doReload: () => window.location.reload(),
      quiet: false,
      ...window.coi,
    };

    if (coi.shouldDeregister()) {
      navigator.serviceWorker &&
        navigator.serviceWorker.controller &&
        navigator.serviceWorker.controller.postMessage({ type: "deregister" });
    }

    if (window.crossOriginIsolated !== false) {
      // If already isolated, nothing to do
      return;
    }

    if (!window.isSecureContext) {
      !coi.quiet && console.log("COOP/COEP Service Worker requires a secure context (HTTPS or localhost).");
      return;
    }

    if (navigator.serviceWorker) {
      navigator.serviceWorker.register(window.document.currentScript ? window.document.currentScript.src : "coi-serviceworker.js").then(
        (registration) => {
          !coi.quiet && console.log("COOP/COEP Service Worker registered", registration.scope);

          registration.addEventListener("updatefound", () => {
            !coi.quiet && console.log("Reloading page to apply COOP/COEP headers.");
            coi.doReload();
          });

          // If the registration is active, but it's not controlling the page
          if (registration.active && !navigator.serviceWorker.controller) {
            !coi.quiet && console.log("Reloading page to activate COOP/COEP controller.");
            coi.doReload();
          }
        },
        (err) => {
          !coi.quiet && console.error("COOP/COEP Service Worker failed to register: ", err);
        }
      );
    }
  })();
}
