import esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

const entries = [
  'api/index.ts',
]
const external = [
  'heimdall-ts',
]

const plugins = [
  resolve({browser: true, preferBuiltins: false}),
  json(),
  commonjs(),
  esbuild({
    target: 'node14',
  }),
]

export default [
  {
    input: entries,
    output: {
      dir: 'build',
      format: 'esm',
      entryFileNames: '[name].mjs',
    },
    external,
    plugins,
  },
  {
    input: entries,
    output: {
      dir: 'build',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      exports: 'named',
    },
    external,
    plugins,
  },
  {
    input: entries,
    output: {
      dir: 'build',
      entryFileNames: '[name].d.ts',
      format: 'esm',
    },
    external,
    plugins: [
      dts({respectExternal: true}),
    ],
  },
]
