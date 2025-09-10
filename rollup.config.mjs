import copy from '@guanghechen/rollup-plugin-copy';

export default [{
  input: 'src/scripts/honor-and-intrigue.mjs',
  output: {
    file: 'public/honor-and-intrigue.mjs',
    sourcemap: true,
  },
  plugins: [
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
