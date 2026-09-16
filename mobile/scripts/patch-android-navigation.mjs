import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../android/', import.meta.url).pathname;
const activityPath = join(root, 'app', 'src', 'main', 'java', 'mw', 'vmcxtreme', 'memberportal', 'MainActivity.java');

const content = `package mw.vmcxtreme.memberportal;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onBackPressed() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            super.onBackPressed();
            return;
        }

        webView.evaluateJavascript(
            "(function(){" +
            "var closeSelectors='[data-close], [aria-label=\\\"Close\\\"], [aria-label*=\\\"Close\\\" i], .modal-close, .drawer-close, .close-modal, .close-drawer';" +
            "var overlay=document.querySelector('dialog[open], .modal.show, .modal.is-open, .drawer.open, .drawer.is-open, [role=\\\"dialog\\\"]');" +
            "if(overlay){var close=overlay.querySelector(closeSelectors);if(close){close.click();return 'closed';}" +
            "overlay.removeAttribute('open');overlay.classList.remove('show','is-open','open');return 'closed';}" +
            "var title=(document.title||'').toLowerCase();" +
            "var body=(document.body&&document.body.innerText||'').toLowerCase();" +
            "var portal=title.indexOf('portal')>=0 || !!document.querySelector('[data-member-portal], #member-portal, #management-portal, .member-portal, .management-portal');" +
            "return portal?'portal':'public';" +
            "})()",
            value -> {
                if (value != null && value.contains("closed")) {
                    return;
                }

                if (value != null && value.contains("portal")) {
                    // Portal is a single-page remote app. Do not navigate its
                    // browser history back to the public landing page.
                    moveTaskToBack(true);
                    return;
                }

                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    MainActivity.super.onBackPressed();
                }
            }
        );
    }
}
`;

await mkdir(join(activityPath, '..'), { recursive: true });
await writeFile(activityPath, content, 'utf8');
console.log('Android back button now closes overlays, backgrounds the portal, and navigates public history safely.');
