import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../android/', import.meta.url).pathname;
const activityPath = join(root, 'app', 'src', 'main', 'java', 'mw', 'vmcxtreme', 'memberportal', 'MainActivity.java');
const existing = await readFile(activityPath, 'utf8');

const imports = `import android.webkit.CookieManager;\nimport android.webkit.WebSettings;\n`;
const updatedImports = existing.includes('import android.webkit.CookieManager;')
  ? existing
  : existing.replace('import android.webkit.WebView;\n', `import android.webkit.WebView;\n${imports}`);

const onCreate = `
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
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

let result = updatedImports;
if (!result.includes('settings.setDomStorageEnabled(true);')) {
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
console.log('Android WebView cookie and DOM storage persistence enabled.');
