import copy from '@guanghechen/rollup-plugin-copy';
import del from 'rollup-plugin-delete';

export default [{
  input: 'src/scripts/honor-and-intrigue.mjs',
  output: {
    file: 'public/honor-and-intrigue.mjs',
    sourcemap: true,
  },
  plugins: [
    del({
      runOnce: true,
      targets: ['public/*', '!public/packs'],
    }),
    copy({
      targets: [
        { src: 'static/assets', dest: 'public' },
        { src: 'static/lang', dest: 'public' },
        { src: 'static/system.json', dest: 'public' },
        { src: 'static/templates', dest: 'public', flatten: false },
      ],
    }),
  ],
}];
