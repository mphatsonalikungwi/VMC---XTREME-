import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../android/', import.meta.url).pathname;
const res = join(root, 'app', 'src', 'main', 'res');

const files = {
  'values/vmc_brand.xml': `<?xml version="1.0" encoding="utf-8"?><resources><color name="vmc_icon_background">#FF304F</color></resources>`,

  // Adaptive-icon foregrounds are 108dp canvases. The bitmap must be explicitly
  // filled into the inset bounds; gravity="center" leaves a large source bitmap
  // at its intrinsic size and causes Samsung launchers to crop it.
  'drawable/vmc_icon_foreground.xml': `<?xml version="1.0" encoding="utf-8"?><inset xmlns:android="http://schemas.android.com/apk/res/android" android:insetLeft="30dp" android:insetTop="30dp" android:insetRight="30dp" android:insetBottom="30dp"><bitmap android:src="@drawable/vmc_logo" android:gravity="fill" android:antialias="true" android:filter="true"/></inset>`,

  // Explicit legacy fallback. Some file managers and launchers inspect the
  // non-v26 launcher resource instead of the adaptive icon resource.
  'drawable/vmc_legacy_icon.xml': `<?xml version="1.0" encoding="utf-8"?><layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/vmc_icon_background"/><item android:left="18dp" android:top="18dp" android:right="18dp" android:bottom="18dp"><bitmap android:src="@drawable/vmc_logo" android:gravity="fill" android:antialias="true" android:filter="true"/></item></layer-list>`,

  'mipmap-anydpi-v26/ic_launcher.xml': `<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/vmc_icon_background"/><foreground android:drawable="@drawable/vmc_icon_foreground"/></adaptive-icon>`,
  'mipmap-anydpi-v26/ic_launcher_round.xml': `<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/vmc_icon_background"/><foreground android:drawable="@drawable/vmc_icon_foreground"/></adaptive-icon>`,

  // Non-adaptive fallback resources. These override Capacitor's generated
  // density-specific PNG references on supported resource resolution paths.
  'mipmap-anydpi/ic_launcher.xml': `<?xml version="1.0" encoding="utf-8"?><bitmap xmlns:android="http://schemas.android.com/apk/res/android" android:src="@drawable/vmc_legacy_icon" android:gravity="fill"/>`,
  'mipmap-anydpi/ic_launcher_round.xml': `<?xml version="1.0" encoding="utf-8"?><bitmap xmlns:android="http://schemas.android.com/apk/res/android" android:src="@drawable/vmc_legacy_icon" android:gravity="fill"/>`
};

for (const [relative, content] of Object.entries(files)) {
  const target = join(res, relative);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content, 'utf8');
}

console.log('VMC launcher resources prepared: scaled bitmap foreground, adaptive icon, and legacy fallback.');
