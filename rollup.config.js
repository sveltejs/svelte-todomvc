import svelte from 'rollup-plugin-svelte';

export default {
	entry: 'src/app.js',
	dest: 'dist/bundle.js',
	format: 'iife',
	plugins: [
		svelte()
	],
	sourceMap: true
};
