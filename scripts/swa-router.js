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
			const isHtml = route.includes(".html");
			return {
				route: route
					.split('.')
					.slice(0, -1)
					.join('.'),
				rewrite: route,
				...(isHtml ? {headers: {"Cache-Control": "no-cache"}} : {})
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
	globalHeaders: {
		"cache-control": "public, max-age=604800, immutable"
	},
	"networking": {
		"allowedIpRanges": ["AzureFrontDoor.Backend"]
	},
	"forwardingGateway": {
		"requiredHeaders": {
			"X-Azure-FDID" : "da108622-5865-433c-b465-fb77580f4aea"
		},
		"allowedForwardedHosts": [
			"frontend-endpoint.z01.azurefd.net"
		]
	}
};
fs.writeFileSync('./out/staticwebapp.config.json', JSON.stringify(config, null, 4));
