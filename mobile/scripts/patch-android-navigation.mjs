import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../android/', import.meta.url).pathname;
const activityPath = join(root, 'app', 'src', 'main', 'java', 'mw', 'vmcxtreme', 'memberportal', 'MainActivity.java');

const content = `package mw.vmcxtreme.memberportal;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean portalBackGuard = false;

    @Override
    public void onBackPressed() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            super.onBackPressed();
            return;
        }

        String currentUrl = webView.getUrl();
        boolean isVmcSite = currentUrl != null && currentUrl.startsWith("https://vmcxtreme.pages.dev");

        // The VMC portal is a single-page application. A browser-history entry
        // can point to the public landing view even while the member is inside
        // the authenticated portal. Never follow that entry blindly.
        if (isVmcSite && !portalBackGuard) {
            portalBackGuard = true;
            webView.evaluateJavascript(
                "(function(){" +
                "var active=document.querySelector('.modal.show,.modal[aria-hidden=\\\"false\\\"],dialog[open],[data-modal].is-open,.drawer.open,.sidebar.open,.nav-menu.open');" +
                "if(active){var b=active.querySelector('[data-close],.close,[aria-label*=\\\"Close\\\" i],button');if(b)b.click();return 'closed';}" +
                "return 'portal-root';" +
                "})()",
                value -> portalBackGuard = false
            );
            return;
        }

        if (webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }
}
`;

await mkdir(join(activityPath, '..'), { recursive: true });
await writeFile(activityPath, content, 'utf8');
console.log('Android portal-aware back navigation behavior applied.');
