import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../android/', import.meta.url).pathname;
const activityPath = join(root, 'app', 'src', 'main', 'java', 'mw', 'vmcxtreme', 'memberportal', 'MainActivity.java');
const existing = await readFile(activityPath, 'utf8');

let result = existing;
if (!result.includes('import android.graphics.Color;')) {
  result = result.replace('import android.os.Bundle;\n', 'import android.os.Bundle;\nimport android.graphics.Color;\n');
}
if (!result.includes('import android.webkit.CookieManager;')) {
  result = result.replace('import android.webkit.WebView;\n', 'import android.webkit.WebView;\nimport android.webkit.CookieManager;\nimport android.webkit.WebSettings;\n');
}

const onCreate = `
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            webView.setBackgroundColor(Color.BLACK);
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptEnabled(true);
            CookieManager cookies = CookieManager.getInstance();
            cookies.setAcceptCookie(true);
            cookies.setAcceptThirdPartyCookies(webView, true);
            cookies.flush();
        }
`;

if (!result.includes('webView.setBackgroundColor(Color.BLACK);')) {
  result = result.replace('super.onCreate(savedInstanceState);\n', `super.onCreate(savedInstanceState);\n${onCreate}`);
}

if (!result.includes('public void onStop()')) {
  result = result.replace('\n    @Override\n    public void onBackPressed()', `
    @Override
    public void onStop() {
        CookieManager.getInstance().flush();
        super.onStop();
    }

    @Override
    public void onBackPressed()`);
}

await writeFile(activityPath, result, 'utf8');
console.log('Android WebView cookie persistence and black loading background enabled.');
