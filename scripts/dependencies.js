const { resolve } = require('path');
const { readdir } = require('fs').promises;
const fs = require('fs');
const path = require('path');

/* Removes unused files unrelated to API by traversing the .nft files produced by output: "standalone" next.config.js */
async function* getFiles(dir) {
	const dirents = await readdir(dir, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = resolve(dir, dirent.name);
		if (dirent.isDirectory()) {
			yield* getFiles(res);
		} else {
			yield res;
		}
	}
}

(async () => {
	const dependencies = new Set([]);
	for await (const f of getFiles('.next/standalone/.next/server/pages/api')) {
		/* add all of our endpoints dependencies */
		if (!f.includes('nft.json')) continue;
		const { files } = JSON.parse(fs.readFileSync(f, 'utf8'));
		files.forEach((file) => {
			const joined = path.join(f, '../' + file);
			dependencies.add(joined);
		});
	}
	for await (const f of getFiles('.next/standalone')) {
		if (f.includes('.nft.json')) fs.unlinkSync(f);
		if (
			dependencies.has(f) ||
			f.includes('pages-manifest') ||
			f.includes('routes-manifest') ||
			(f.includes('pages') && f.includes('api'))
		) {
			continue;
		}
		try {
			fs.unlinkSync(f);
		} catch (e) {
			// catch n kill
		}
	}
	console.log('cleaned');
})();
