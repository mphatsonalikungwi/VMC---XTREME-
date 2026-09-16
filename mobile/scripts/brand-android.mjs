import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../android/', import.meta.url).pathname;
const res = join(root, 'app', 'src', 'main', 'res');

const files = {
  'values/vmc_brand.xml': `<?xml version="1.0" encoding="utf-8"?><resources><color name="vmc_icon_background">#FF304F</color></resources>`,

  // Android adaptive-icon layers use a 108dp canvas. Android documents a
  // 66dp protected logo area. A 21dp inset produces a 66dp foreground asset:
  // large enough to match normal launcher icons without being clipped.
  'drawable/vmc_icon_foreground.xml': `<?xml version="1.0" encoding="utf-8"?><inset xmlns:android="http://schemas.android.com/apk/res/android" android:insetLeft="21dp" android:insetTop="21dp" android:insetRight="21dp" android:insetBottom="21dp"><bitmap android:src="@drawable/vmc_logo" android:gravity="fill" android:antialias="true" android:filter="true"/></inset>`,

  // Legacy fallback uses the same 66dp protected area on a 108dp canvas.
  'drawable/vmc_legacy_icon.xml': `<?xml version="1.0" encoding="utf-8"?><layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/vmc_icon_background"/><item android:left="21dp" android:top="21dp" android:right="21dp" android:bottom="21dp"><bitmap android:src="@drawable/vmc_logo" android:gravity="fill" android:antialias="true" android:filter="true"/></item></layer-list>`,

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

console.log('VMC launcher icon uses a 66dp adaptive safe-zone foreground.');
