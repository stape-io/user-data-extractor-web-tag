import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const banner = `/*! ${pkg.name} v${pkg.version} | ${new Date().toISOString()} */`;

export default {
  input: 'src/index.js',
  output: [
    // Dev
    {
      file: 'dist/user-data-collector.js',
      format: 'iife',
      name: 'collectUserDataAuto',
      exports: 'default',
      banner: banner
    },
    // Prod
    {
      file: 'dist/user-data-collector.min.js',
      format: 'iife',
      name: 'collectUserDataAuto',
      exports: 'default',
      plugins: [
        terser({
          format: { comments: /^!/ } // keep comments that start with /*! ... */
        })
      ],
      banner: banner
    }
  ],
  plugins: [resolve({ browser: true }), commonjs(), json()],
  treeshake: {
    moduleSideEffects: false
  }
};
