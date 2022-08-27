const fs = require("fs");

const config = {
	routes: [
		{
			route: "/*.js",
			headers: {
				"cache-control": "public, max-age=604800, immutable"
			},
		},
		{
			route: "/*.css",
			headers: {
				"cache-control": "public, max-age=604800, immutable"
			},
		}
	],
	responseOverrides: {
		'404': {
			rewrite: '/404.html',
		},
	},
	platform: {
		apiRuntime: 'node:16',
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
