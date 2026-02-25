// CreatorOS Permission Guard - Content Script
// Blocks OnlyFans pages based on employee permissions injected via window.__CREATOROS_PERMISSIONS__
// Also hides Statements/Statistics/More sidebar links for restricted employees.

(function () {
  "use strict";

  // Permission-to-blocked-path mapping
  const RULES = [
    {
      flags: ["can_view_chats", "can_send_messages"],
      combineOr: true,
      paths: ["/my/chats", "/my/chat/"],
    },
    {
      flags: ["can_view_fans"],
      paths: ["/my/subscribers", "/my/fans", "/my/lists"],
    },
    {
      flags: ["can_view_earnings"],
      paths: ["/my/banking", "/my/statistics", "/my/statements", "/my/payout"],
    },
    {
      flags: ["can_view_posts", "can_create_posts"],
      combineOr: true,
      paths: ["/my/posts", "/my/queue"],
    },
    {
      flags: ["can_view_vault"],
      paths: ["/my/vault", "/my/media"],
    },
    {
      flags: ["can_view_notifications"],
      paths: ["/my/notifications"],
    },
  ];

  let permissions = null;
  let overlayShown = false;

  function getPermissions() {
    if (permissions) return permissions;
    if (window.__CREATOROS_PERMISSIONS__) {
      permissions = window.__CREATOROS_PERMISSIONS__;
      return permissions;
    }
    const meta = document.querySelector('meta[name="creatoros-permissions"]');
    if (meta) {
      try {
        permissions = JSON.parse(meta.getAttribute("content"));
        return permissions;
      } catch {}
    }
    return null;
  }

  function isPathBlocked(pathname) {
    const perms = getPermissions();
    if (!perms) return false;

    for (const rule of RULES) {
      const matchesPath = rule.paths.some(
        (p) => pathname.startsWith(p) || pathname === p
      );
      if (!matchesPath) continue;

      if (rule.combineOr) {
        const allFalse = rule.flags.every((f) => perms[f] === false);
        if (allFalse) return rule;
      } else {
        const anyFalse = rule.flags.some((f) => perms[f] === false);
        if (anyFalse) return rule;
      }
    }
    return false;
  }

  function showBlockedOverlay(rule) {
    if (overlayShown) return;
    overlayShown = true;

    const overlay = document.createElement("div");
    overlay.id = "creatoros-blocked-overlay";
    overlay.innerHTML = `
      <div class="creatoros-blocked-container">
        <div class="creatoros-blocked-icon">🔒</div>
        <h2 class="creatoros-blocked-title">Access Restricted</h2>
        <p class="creatoros-blocked-message">
          You don't have permission to access this section.
          <br/>Contact your manager to update your access level.
        </p>
        <div class="creatoros-blocked-permissions">
          <span>Required: ${rule.flags.map((f) => f.replace(/^can_/, "").replace(/_/g, " ")).join(", ")}</span>
        </div>
        <button class="creatoros-blocked-back" onclick="history.back()">← Go Back</button>
      </div>
    `;
    document.documentElement.appendChild(overlay);

    if (document.body) {
      document.body.style.display = "none";
    }
  }

  function removeOverlay() {
    const el = document.getElementById("creatoros-blocked-overlay");
    if (el) {
      el.remove();
      overlayShown = false;
      if (document.body) document.body.style.display = "";
    }
  }

  function checkAndBlock() {
    const blocked = isPathBlocked(window.location.pathname);
    if (blocked) {
      showBlockedOverlay(blocked);
    } else {
      removeOverlay();
    }
  }

  // Targeted sidebar link hiding (Statements, Statistics, More)
  function hideSidebarLinks() {
    const perms = getPermissions();
    if (!perms) return;

    // Only inject once
    if (document.getElementById("creatoros-sidebar-restrictions")) return;

    const cssRules = [];
    if (perms.can_view_earnings === false) {
      cssRules.push('a[href="/my/statements"] { display: none !important; }');
      cssRules.push('a[href="/my/statistics"] { display: none !important; }');
    }
    // Always hide "More" for non-admin employees
    cssRules.push('[data-name="more"], a[href="/more"] { display: none !important; }');

    if (cssRules.length > 0) {
      const style = document.createElement("style");
      style.id = "creatoros-sidebar-restrictions";
      style.textContent = cssRules.join("\n");
      (document.head || document.documentElement).appendChild(style);
    }
  }

  // Check on initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      checkAndBlock();
      hideSidebarLinks();
    });
  } else {
    checkAndBlock();
    hideSidebarLinks();
  }

  // Monitor SPA navigation (OnlyFans is a SPA)
  const origPush = history.pushState;
  const origReplace = history.replaceState;

  history.pushState = function () {
    origPush.apply(this, arguments);
    setTimeout(checkAndBlock, 50);
  };

  history.replaceState = function () {
    origReplace.apply(this, arguments);
    setTimeout(checkAndBlock, 50);
  };

  window.addEventListener("popstate", () => setTimeout(checkAndBlock, 50));

  // Wait for permissions to be set late
  let retries = 0;
  const waitForPerms = setInterval(() => {
    if (getPermissions() || retries > 20) {
      clearInterval(waitForPerms);
      checkAndBlock();
      hideSidebarLinks();
    }
    retries++;
  }, 500);

  // Block navigation links that point to restricted pages
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link) return;
    try {
      const url = new URL(link.href, window.location.origin);
      if (
        url.origin === window.location.origin &&
        isPathBlocked(url.pathname)
      ) {
        e.preventDefault();
        e.stopPropagation();
        checkAndBlock();
      }
    } catch {}
  }, true);

  console.log("CreatorOS Permission Guard: Active");
})();
