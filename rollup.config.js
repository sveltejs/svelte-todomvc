import svelte from 'rollup-plugin-svelte';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';

const plugins = [ svelte() ];
if ( process.env.production ) plugins.push( buble(), uglify() );

export default {
	entry: 'src/app.js',
	dest: 'dist/bundle.js',
	format: 'iife',
	plugins,
	sourceMap: true
};
