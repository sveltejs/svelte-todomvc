import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import closure from '@ampproject/rollup-plugin-closure-compiler';
import filesize from 'rollup-plugin-filesize';

const prod = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/main.js',
	output: {
		file: 'public/bundle.js',
		format: 'iife',
		sourcemap: true
	},
	plugins: [
		svelte(),
		prod && terser(), // you can also try `closure()`
		prod && filesize()
	]
};
