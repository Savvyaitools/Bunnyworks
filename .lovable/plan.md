

# Remove Left Panel, Use OnlyFans Native Sidebar with Role-Based Hiding

## Overview
Remove the custom left panel (BrowserSessionPanel) from the embedded browser viewer entirely. Instead, keep OnlyFans' own sidebar visible and inject CSS via CDP to hide restricted menu items (Statements, Statistics, More) for Chatters and VAs.

## Changes

### 1. Strip BrowserSessionPanel from EmbeddedBrowserViewer
**File: `src/components/browser/EmbeddedBrowserViewer.tsx`**
- Remove all imports and references to `BrowserSessionPanel`
- Remove the `Sheet` mobile panel wrapper
- Remove `panelOpen` state and the panel toggle button from the toolbar
- Remove `PanelLeftClose`/`PanelLeftOpen` icons
- The iframe becomes the only content in the main area, taking full width

### 2. Inject Role-Based CSS into the Remote Browser via CDP
**File: `supabase/functions/browserbase-session/index.ts`**
- Add a new action: `inject_sidebar_restrictions`
- Uses CDP `Runtime.evaluate` to inject a `<style>` tag into the OnlyFans page that hides specific sidebar links based on the employee's permissions
- Target selectors based on OF DOM: links containing `/my/statistics`, `/my/statements`, and the "More" expandable menu item
- Called automatically after session launch or navigation

### 3. Auto-Inject on Session Connect
**File: `src/components/browser/EmbeddedBrowserViewer.tsx`**
- On iframe load, if `permissions` prop is provided and the user is not an admin (i.e., certain flags are false), call the edge function to inject the restriction CSS into the remote browser
- This runs once on load and is resilient to OnlyFans SPA re-renders by using a `MutationObserver` in the injected script

### 4. Update Chrome Extension to Stop Hiding the Full Sidebar
**File: `chrome-extension-permissions/content.js`**
- Remove the `hideOFSidebar()` function and its interval
- Keep the permission-guard path blocking and overlay logic intact
- Instead, add targeted hiding of Statements/Statistics/More links (matching the CDP injection approach)

**File: `chrome-extension-permissions/blocked.css`**
- Remove the sidebar-hiding CSS rules (`.b-sidebar`, `.l-sidebar`, etc.)
- Keep the blocked overlay styles

## Technical Details

The injected script will look like:
```text
// Injected via CDP Runtime.evaluate
(function() {
  const style = document.createElement('style');
  style.id = 'creatoros-sidebar-restrictions';
  style.textContent = `
    a[href="/my/statements"] { display: none !important; }
    a[href="/my/statistics"] { display: none !important; }
    /* "More" menu item - hide based on OF DOM pattern */
    [data-name="more"], a[href="/more"] { display: none !important; }
  `;
  document.head.appendChild(style);
})();
```

The CSS selectors will target OnlyFans sidebar links by their `href` attribute, which is stable across OF updates. The injection happens via the existing `navigate_in_session` CDP infrastructure.

## Files Modified
- `src/components/browser/EmbeddedBrowserViewer.tsx` -- Remove panel, add restriction injection on load
- `supabase/functions/browserbase-session/index.ts` -- New `inject_sidebar_restrictions` action
- `chrome-extension-permissions/content.js` -- Stop hiding full sidebar, add targeted hiding
- `chrome-extension-permissions/blocked.css` -- Remove sidebar-hiding rules
