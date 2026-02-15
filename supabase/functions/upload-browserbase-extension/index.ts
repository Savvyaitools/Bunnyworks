import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Permission Guard extension files ────────────────────────────────
const PG_MANIFEST = JSON.stringify({
  manifest_version: 3,
  name: "CreatorOS Permission Guard",
  version: "1.0.0",
  description:
    "Enforces role-based access restrictions on OnlyFans pages based on employee permissions",
  permissions: ["storage"],
  host_permissions: ["https://*.onlyfans.com/*"],
  content_scripts: [
    {
      matches: ["https://*.onlyfans.com/*"],
      js: ["content.js"],
      css: ["blocked.css"],
      run_at: "document_start",
      all_frames: false,
    },
  ],
});

const PG_CONTENT = `(function(){"use strict";const RULES=[{flags:["can_view_chats","can_send_messages"],combineOr:true,paths:["/my/chats","/my/chat/"]},{flags:["can_view_fans"],paths:["/my/subscribers","/my/fans","/my/lists"]},{flags:["can_view_earnings"],paths:["/my/banking","/my/statistics","/my/statements","/my/payout"]},{flags:["can_view_posts","can_create_posts"],combineOr:true,paths:["/my/posts","/my/queue"]},{flags:["can_view_vault"],paths:["/my/vault","/my/media"]},{flags:["can_view_notifications"],paths:["/my/notifications"]}];let permissions=null;let overlayShown=false;function getPermissions(){if(permissions)return permissions;if(window.__CREATOROS_PERMISSIONS__){permissions=window.__CREATOROS_PERMISSIONS__;return permissions}const meta=document.querySelector('meta[name="creatoros-permissions"]');if(meta){try{permissions=JSON.parse(meta.getAttribute("content"));return permissions}catch{}}return null}function isPathBlocked(pathname){const perms=getPermissions();if(!perms)return false;for(const rule of RULES){const matchesPath=rule.paths.some(p=>pathname.startsWith(p)||pathname===p);if(!matchesPath)continue;if(rule.combineOr){if(rule.flags.every(f=>perms[f]===false))return rule}else{if(rule.flags.some(f=>perms[f]===false))return rule}}return false}function showBlockedOverlay(rule){if(overlayShown)return;overlayShown=true;const overlay=document.createElement("div");overlay.id="creatoros-blocked-overlay";overlay.innerHTML='<div class="creatoros-blocked-container"><div class="creatoros-blocked-icon">\\u{1F512}</div><h2 class="creatoros-blocked-title">Access Restricted</h2><p class="creatoros-blocked-message">You don\\'t have permission to access this section.<br/>Contact your manager to update your access level.</p><div class="creatoros-blocked-permissions"><span>Required: '+rule.flags.map(f=>f.replace(/^can_/,"").replace(/_/g," ")).join(", ")+'</span></div><button class="creatoros-blocked-back" onclick="history.back()">\\u2190 Go Back</button></div>';document.documentElement.appendChild(overlay);if(document.body)document.body.style.display="none"}function removeOverlay(){const el=document.getElementById("creatoros-blocked-overlay");if(el){el.remove();overlayShown=false;if(document.body)document.body.style.display=""}}function checkAndBlock(){const blocked=isPathBlocked(window.location.pathname);if(blocked)showBlockedOverlay(blocked);else removeOverlay()}function hideOFSidebar(){const sels=[".b-sidebar",".l-sidebar",'nav[class*="sidebar"]','aside[class*="sidebar"]',"div.l-sidebar__menu"];for(const s of sels)document.querySelectorAll(s).forEach(el=>{el.style.setProperty("display","none","important");el.style.setProperty("width","0","important")});const navLinks=document.querySelectorAll('a[href="/"]');for(const link of navLinks){const parent=link.closest('nav, aside, div[role="navigation"]');if(parent&&parent.querySelector('a[href="/my/chats"]')){parent.style.setProperty("display","none","important");parent.style.setProperty("width","0","important");const wrapper=document.querySelector(".l-wrapper, .b-wrapper, main");if(wrapper){wrapper.style.setProperty("margin-left","0","important");wrapper.style.setProperty("padding-left","0","important")}break}}}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",()=>{checkAndBlock();hideOFSidebar()})}else{checkAndBlock();hideOFSidebar()}const sidebarInterval=setInterval(hideOFSidebar,2000);setTimeout(()=>clearInterval(sidebarInterval),30000);const origPush=history.pushState;const origReplace=history.replaceState;history.pushState=function(){origPush.apply(this,arguments);setTimeout(checkAndBlock,50)};history.replaceState=function(){origReplace.apply(this,arguments);setTimeout(checkAndBlock,50)};window.addEventListener("popstate",()=>setTimeout(checkAndBlock,50));let retries=0;const waitForPerms=setInterval(()=>{if(getPermissions()||retries>20){clearInterval(waitForPerms);checkAndBlock()}retries++},500);document.addEventListener("click",e=>{const link=e.target.closest("a[href]");if(!link)return;try{const url=new URL(link.href,window.location.origin);if(url.origin===window.location.origin&&isPathBlocked(url.pathname)){e.preventDefault();e.stopPropagation();checkAndBlock()}}catch{}},true);console.log("CreatorOS Permission Guard: Active")})();`;

const PG_BLOCKED_CSS = `.b-sidebar,.l-sidebar,nav.b-sidebar,div.l-sidebar__menu,div[class*="sidebar"],aside.b-sidebar{display:none!important;width:0!important;min-width:0!important;overflow:hidden!important}.l-wrapper,.b-wrapper,main.l-wrapper{margin-left:0!important;padding-left:0!important}#creatoros-blocked-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}.creatoros-blocked-container{text-align:center;max-width:420px;padding:48px 32px;background:#1a1a2e;border-radius:16px;border:1px solid rgba(255,255,255,.08);box-shadow:0 25px 50px -12px rgba(0,0,0,.5)}.creatoros-blocked-icon{font-size:56px;margin-bottom:16px}.creatoros-blocked-title{font-size:24px;font-weight:700;color:#fff;margin:0 0 12px}.creatoros-blocked-message{font-size:14px;color:rgba(255,255,255,.6);line-height:1.6;margin:0 0 20px}.creatoros-blocked-permissions{display:inline-flex;padding:6px 14px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);border-radius:8px;margin-bottom:24px}.creatoros-blocked-permissions span{font-size:12px;color:#f87171;text-transform:capitalize}.creatoros-blocked-back{display:inline-flex;align-items:center;padding:10px 24px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:#fff;font-size:14px;font-weight:500;cursor:pointer;transition:background .2s}.creatoros-blocked-back:hover{background:rgba(255,255,255,.2)}`;

// ── Analytics Scraper extension files ────────────────────────────────
const AS_MANIFEST = JSON.stringify({
  manifest_version: 3,
  name: "Creator OS Browser Sync",
  version: "1.0.0",
  description: "Sync data from creator platforms directly to Creator OS",
  permissions: ["activeTab", "storage"],
  host_permissions: [
    "https://*.onlyfans.com/*",
    "https://*.fansly.com/*",
  ],
  content_scripts: [
    {
      matches: ["https://*.onlyfans.com/*", "https://*.fansly.com/*"],
      js: ["content.js"],
      run_at: "document_idle",
    },
  ],
  background: { service_worker: "background.js" },
  externally_connectable: {
    matches: ["*://*.lovableproject.com/*", "*://localhost:*/*"],
  },
});

const AS_CONTENT = `(function(){const marker=document.createElement("div");marker.id="creator-os-extension-marker";marker.style.display="none";marker.setAttribute("data-version","1.0.0");document.body.appendChild(marker);console.log("Creator OS Browser Sync: Extension detected on this page")})();chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{if(message.type==="EXTRACT_DATA"){sendResponse({url:window.location.href,title:document.title,timestamp:new Date().toISOString()})}return true});`;

const AS_BACKGROUND = `chrome.runtime.onMessageExternal.addListener((message,sender,sendResponse)=>{if(message.type==="PING"){sendResponse({status:"ok",version:"1.0.0"});return true}if(message.type==="SET_TOKEN"){chrome.storage.local.set({syncToken:message.token,isConnected:true});sendResponse({success:true});return true}});chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{if(message.type==="GET_STATUS"){chrome.storage.local.get(["syncToken","isConnected"],result=>{sendResponse({connected:result.isConnected||false,hasToken:!!result.syncToken})});return true}});chrome.runtime.onInstalled.addListener(()=>{console.log("Creator OS Browser Sync extension installed")});`;

// ── Minimal ZIP builder ─────────────────────────────────────────────
function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    // Local file header (30 + name + data)
    const local = new Uint8Array(30 + nameBytes.length + size);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression = store
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // compressed
    lv.setUint32(22, size, true); // uncompressed
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra length
    local.set(nameBytes, 30);
    local.set(file.data, 30 + nameBytes.length);
    localHeaders.push(local);

    // Central directory header (46 + name)
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0x20, true); // ext attrs
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralHeaders.push(central);

    offset += local.length;
  }

  const cdSize = centralHeaders.reduce((s, c) => s + c.length, 0);

  // End of central directory (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const total = offset + cdSize + 22;
  const result = new Uint8Array(total);
  let pos = 0;
  for (const h of localHeaders) { result.set(h, pos); pos += h.length; }
  for (const c of centralHeaders) { result.set(c, pos); pos += c.length; }
  result.set(eocd, pos);
  return result;
}

// ── Main handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, agencyId } = await req.json();

    if (!type || !agencyId) {
      return new Response(JSON.stringify({ error: "type and agencyId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enc = new TextEncoder();
    let files: { name: string; data: Uint8Array }[];
    let extName: string;
    let extDescription: string;

    if (type === "permission_guard") {
      files = [
        { name: "manifest.json", data: enc.encode(PG_MANIFEST) },
        { name: "content.js", data: enc.encode(PG_CONTENT) },
        { name: "blocked.css", data: enc.encode(PG_BLOCKED_CSS) },
      ];
      extName = "Permission Guard";
      extDescription = "Hides OnlyFans sidebar and blocks restricted pages based on employee permissions";
    } else if (type === "analytics_scraper") {
      files = [
        { name: "manifest.json", data: enc.encode(AS_MANIFEST) },
        { name: "content.js", data: enc.encode(AS_CONTENT) },
        { name: "background.js", data: enc.encode(AS_BACKGROUND) },
      ];
      extName = "Analytics Scraper";
      extDescription = "Detects extension presence and extracts page data for analytics import";
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Use "permission_guard" or "analytics_scraper"' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build ZIP
    const zipBytes = buildZip(files);

    // Upload to Browserbase
    const apiKey = Deno.env.get("BROWSERBASE_API_KEY");
    if (!apiKey) throw new Error("BROWSERBASE_API_KEY not configured");

    const boundary = "----BrowserbaseUpload" + Date.now();
    const fileName = type === "permission_guard" ? "permission-guard.zip" : "analytics-scraper.zip";

    // Build multipart body
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/zip\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const headerBytes = enc.encode(header);
    const footerBytes = enc.encode(footer);
    const body = new Uint8Array(headerBytes.length + zipBytes.length + footerBytes.length);
    body.set(headerBytes, 0);
    body.set(zipBytes, headerBytes.length);
    body.set(footerBytes, headerBytes.length + zipBytes.length);

    console.log(`Uploading ${extName} extension to Browserbase (${zipBytes.length} bytes)...`);

    const bbResponse = await fetch("https://api.browserbase.com/v1/extensions", {
      method: "POST",
      headers: {
        "x-bb-api-key": apiKey,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    if (!bbResponse.ok) {
      const errText = await bbResponse.text();
      console.error("Browserbase API error:", bbResponse.status, errText);
      throw new Error(`Browserbase API error ${bbResponse.status}: ${errText}`);
    }

    const bbData = await bbResponse.json();
    const extensionId = bbData.id;

    console.log(`Extension uploaded successfully. Browserbase ID: ${extensionId}`);

    // Save to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: dbError } = await supabase.from("browser_extensions").insert({
      agency_id: agencyId,
      name: extName,
      description: extDescription,
      browserbase_extension_id: extensionId,
      auto_inject: true,
      is_active: true,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      throw new Error(`Failed to save extension: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, extensionId, name: extName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
