// CreatorOS Permission Guard - Content Script
// Blocks OnlyFans pages based on employee permissions injected via window.__CREATOROS_PERMISSIONS__

(function () {
  "use strict";

  // Permission-to-blocked-path mapping
  const RULES = [
    {
      flags: ["can_view_chats", "can_send_messages"],
      // Block if BOTH are false
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
    // Try reading from window object (injected by Browserbase startup script)
    if (window.__CREATOROS_PERMISSIONS__) {
      permissions = window.__CREATOROS_PERMISSIONS__;
      return permissions;
    }
    // Try reading from meta tag (fallback)
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
    if (!perms) return false; // No permissions data = allow all (admin sessions)

    for (const rule of RULES) {
      const matchesPath = rule.paths.some(
        (p) => pathname.startsWith(p) || pathname === p
      );
      if (!matchesPath) continue;

      if (rule.combineOr) {
        // Block only if ALL listed flags are false
        const allFalse = rule.flags.every((f) => perms[f] === false);
        if (allFalse) return rule;
      } else {
        // Block if ANY listed flag is false
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

    // Hide the page content
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

  // Hide OnlyFans native sidebar to force navigation through CreatorOS panel
  function hideOFSidebar() {
    // Target known sidebar selectors
    const selectors = [
      '.b-sidebar',
      '.l-sidebar',
      'nav[class*="sidebar"]',
      'aside[class*="sidebar"]',
      'div.l-sidebar__menu',
    ];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('width', '0', 'important');
      });
    }
    // Fallback: find the sidebar by its content pattern (Home, Notifications, Messages links)
    const navLinks = document.querySelectorAll('a[href="/"]');
    for (const link of navLinks) {
      const parent = link.closest('nav, aside, div[role="navigation"]');
      if (parent && parent.querySelector('a[href="/my/chats"]')) {
        parent.style.setProperty('display', 'none', 'important');
        parent.style.setProperty('width', '0', 'important');
        // Expand main content
        const wrapper = document.querySelector('.l-wrapper, .b-wrapper, main');
        if (wrapper) {
          wrapper.style.setProperty('margin-left', '0', 'important');
          wrapper.style.setProperty('padding-left', '0', 'important');
        }
        break;
      }
    }
  }

  // Check on initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      checkAndBlock();
      hideOFSidebar();
    });
  } else {
    checkAndBlock();
    hideOFSidebar();
  }

  // Re-hide sidebar periodically (OnlyFans SPA may re-render)
  const sidebarInterval = setInterval(hideOFSidebar, 2000);
  setTimeout(() => clearInterval(sidebarInterval), 30000); // Stop after 30s

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

  // Also observe for permissions being set late
  let retries = 0;
  const waitForPerms = setInterval(() => {
    if (getPermissions() || retries > 20) {
      clearInterval(waitForPerms);
      checkAndBlock();
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
