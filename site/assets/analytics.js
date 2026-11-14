/* PostHog – měření návštěvnosti webtitan.cz (EU cloud, Frankfurt).
 * Bez cookies a bez ukládání do prohlížeče (persistence: 'memory') → není potřeba cookie lišta.
 * Respektuje „Do Not Track“, bez nahrávání relací. Načítá se až po zobrazení stránky.
 * Vlastní události posílá funkce track() na hlavní stránce (cta_click, form_submit, …). */
(function () {
  "use strict";
  var KEY = "phc_Oukfmj0GMOrAaINE8ZZ5IgsOL0S236aQnA2u7QQPdrU";
  function start() {
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init(KEY, {
      api_host: "https://eu.i.posthog.com",
      defaults: "2026-08-30",
      persistence: "memory",
      person_profiles: "identified_only",
      respect_dnt: true,
      disable_session_recording: true,
      disable_surveys: true
    });
  }
  // Spustí se při první interakci (posun, klik, dotyk, klávesa), nejpozději 4 s po načtení stránky –
  // měření tak vůbec nezdržuje zobrazení webu.
  var started = false, EVENTS = ["scroll", "pointerdown", "keydown", "touchstart"];
  function go() {
    if (started) { return; }
    started = true;
    EVENTS.forEach(function (e) { window.removeEventListener(e, go, true); });
    start();
  }
  function schedule() {
    EVENTS.forEach(function (e) { window.addEventListener(e, go, { capture: true, passive: true, once: true }); });
    window.setTimeout(go, 4000);
  }
  if (document.readyState === "complete") { schedule(); }
  else { window.addEventListener("load", schedule); }
})();
