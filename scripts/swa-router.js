const fs = require("fs");
const walk = function(dir) {
	let results = [];
	const list = fs.readdirSync(dir).filter((dir) => !dir[0].startsWith('_'));
	list.forEach(function(file) {
		file = dir + '/' + file;
		const stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			results = results.concat(walk(file));
		} else {
			results.push(file.split('./out')[1]);
		}
	});
	return results;
};

const config = {
	routes: [
		...walk('./out').map((route) => {
			return {
				route: route
					.split('.')
					.slice(0, -1)
					.join('.'),
				rewrite: route,
			};
		}),
	],
	responseOverrides: {
		'404': {
			rewrite: '/404.html',
		},
	},
	platform: {
		apiRuntime: 'node:16',
	},
};
fs.writeFileSync('./out/staticwebapp.config.json', JSON.stringify(config, null, 4));
