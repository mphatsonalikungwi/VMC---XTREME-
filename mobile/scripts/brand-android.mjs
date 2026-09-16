import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../android/', import.meta.url).pathname;
const res = join(root, 'app', 'src', 'main', 'res');
const logo = join(res, 'drawable', 'vmc_logo.png');

const files = {
  'values/vmc_brand.xml': `<?xml version="1.0" encoding="utf-8"?><resources><color name="vmc_icon_background">#000000</color></resources>`,

  'drawable/vmc_icon_foreground.xml': `<?xml version="1.0" encoding="utf-8"?><inset xmlns:android="http://schemas.android.com/apk/res/android" android:insetLeft="21dp" android:insetTop="21dp" android:insetRight="21dp" android:insetBottom="21dp"><bitmap android:src="@drawable/vmc_logo" android:gravity="fill" android:antialias="true" android:filter="true"/></inset>`,

  'drawable/vmc_legacy_icon.xml': `<?xml version="1.0" encoding="utf-8"?><layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/vmc_icon_background"/><item android:left="21dp" android:top="21dp" android:right="21dp" android:bottom="21dp"><bitmap android:src="@drawable/vmc_logo" android:gravity="fill" android:antialias="true" android:filter="true"/></item></layer-list>`,

  // A native black splash drawable prevents the white WebView flash while the
  // remote Cloudflare Pages document is loading.
  'drawable/vmc_splash.xml': `<?xml version="1.0" encoding="utf-8"?><layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/vmc_icon_background"/><item android:left="72dp" android:top="72dp" android:right="72dp" android:bottom="72dp"><bitmap android:src="@drawable/vmc_logo" android:gravity="center" android:antialias="true" android:filter="true"/></item></layer-list>`,

  'mipmap-anydpi-v26/ic_launcher.xml': `<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/vmc_icon_background"/><foreground android:drawable="@drawable/vmc_icon_foreground"/></adaptive-icon>`,
  'mipmap-anydpi-v26/ic_launcher_round.xml': `<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/vmc_icon_background"/><foreground android:drawable="@drawable/vmc_icon_foreground"/></adaptive-icon>`,
  'mipmap-anydpi/ic_launcher.xml': `<?xml version="1.0" encoding="utf-8"?><bitmap xmlns:android="http://schemas.android.com/apk/res/android" android:src="@drawable/vmc_legacy_icon" android:gravity="fill"/>`,
  'mipmap-anydpi/ic_launcher_round.xml': `<?xml version="1.0" encoding="utf-8"?><bitmap xmlns:android="http://schemas.android.com/apk/res/android" android:src="@drawable/vmc_legacy_icon" android:gravity="fill"/>`
};

for (const [relative, content] of Object.entries(files)) {
  const target = join(res, relative);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content, 'utf8');
}

// Capacitor's splash plugin resolves the splash drawable by resource name.
await copyFile(logo, join(res, 'drawable', 'splash.png'));
console.log('VMC launcher and native splash resources prepared with black branding.');
