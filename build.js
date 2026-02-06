const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  try {
    // Create dist directory if it doesn't exist
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist/helpers', { recursive: true });
    }

    // Build and minify each entry point
    const entryPoints = [
      { in: './index.js', out: './dist/index.js' },
      { in: './helpers/index.js', out: './dist/helpers/index.js' },
    ];

    for (const { in: inFile, out: outFile } of entryPoints) {
      await esbuild.build({
        entryPoints: [inFile],
        outfile: outFile,
        bundle: false,
        minify: true,
        platform: 'node',
        target: 'node24',
      });

      console.log(`✓ Built ${outFile}`);
    }

    // Copy and minify TypeScript declaration files
    const dtsFiles = [
      { src: './index.d.ts', dest: './dist/index.d.ts' },
      { src: './helpers/index.d.ts', dest: './dist/helpers/index.d.ts' },
    ];

    for (const { src, dest } of dtsFiles) {
      fs.copyFileSync(src, dest, fs.constants.COPYFILE_FICLONE);
    }

    console.log('\n✅ Build completed successfully!');
    console.log('📦 Outputs in ./dist directory');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
