import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../android/', import.meta.url).pathname;
const activityPath = join(root, 'app', 'src', 'main', 'java', 'mw', 'vmcxtreme', 'memberportal', 'MainActivity.java');

const content = `package mw.vmcxtreme.memberportal;

import android.os.Bundle;
import android.os.SystemClock;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private long lastBackPress = 0L;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            super.onBackPressed();
            return;
        }

        // The VMC portal is a remote single-page application. Calling
        // WebView.goBack() here can replay the navigation entry that opened
        // the portal and send the member to the public landing page. Never
        // use WebView history as the portal's navigation model.
        webView.evaluateJavascript(
            "(function(){" +
            "var closeSelectors='[data-close], [aria-label=\\\"Close\\\"], [aria-label*=\\\"Close\\\" i], .modal-close, .drawer-close, .close-modal, .close-drawer, button.close';" +
            "var overlay=document.querySelector('dialog[open], [role=\\\"dialog\\\"], .modal.show, .modal.is-open, .modal.open, .drawer.open, .drawer.is-open, .offcanvas.show');" +
            "if(overlay){var close=overlay.querySelector(closeSelectors);if(close){close.click();return 'closed';}" +
            "overlay.removeAttribute('open');overlay.classList.remove('show','is-open','open');overlay.style.display='none';return 'closed';}" +
            "return 'stay';" +
            "})()",
            value -> {
                if (value != null && value.contains("closed")) {
                    lastBackPress = 0L;
                    return;
                }

                long now = SystemClock.elapsedRealtime();
                if (now - lastBackPress < 2000L) {
                    moveTaskToBack(true);
                    lastBackPress = 0L;
                } else {
                    lastBackPress = now;
                    Toast.makeText(MainActivity.this, "Press back again to exit", Toast.LENGTH_SHORT).show();
                }
            }
        );
    }
}
`;

await mkdir(join(activityPath, '..'), { recursive: true });
await writeFile(activityPath, content, 'utf8');
console.log('Android back handling now prevents WebView history navigation, closes overlays, and uses double-back to exit.');
