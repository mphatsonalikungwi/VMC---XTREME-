import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../android/', import.meta.url).pathname;
const res = join(root, 'app', 'src', 'main', 'res');

const files = {
  'values/vmc_brand.xml': `<resources><color name="vmc_icon_background">#FF304F</color></resources>`,
  'drawable/vmc_icon_foreground.xml': `<?xml version="1.0" encoding="utf-8"?><layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:left="38dp" android:top="38dp" android:right="38dp" android:bottom="38dp"><bitmap android:src="@drawable/vmc_logo" android:gravity="center" android:antialias="true"/></item></layer-list>`,
  'mipmap-anydpi-v26/ic_launcher.xml': `<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/vmc_icon_background"/><foreground android:drawable="@drawable/vmc_icon_foreground"/></adaptive-icon>`,
  'mipmap-anydpi-v26/ic_launcher_round.xml': `<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/vmc_icon_background"/><foreground android:drawable="@drawable/vmc_icon_foreground"/></adaptive-icon>`
};

for (const [relative, content] of Object.entries(files)) {
  const target = join(res, relative);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content, 'utf8');
}
console.log('Official VMC launcher resources prepared with conservative adaptive-icon safe-zone padding.');
