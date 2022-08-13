const fs = require('fs-extra');
const f = require('fs');

if (!f.existsSync('api')) f.mkdirSync('api');
if (!f.existsSync('api/function')) f.mkdirSync('api/function');
if (!f.existsSync('api/pages')) f.mkdirSync('api/pages');
if (!f.existsSync('api/chunks')) f.mkdirSync('api/chunks');

fs.copySync('./.next/standalone/node_modules', './api/node_modules');
fs.copySync('./.next/standalone/.next/server/pages', './api/pages');
fs.copySync('./.next/standalone/.next/server/chunks', './api/chunks');

f.writeFileSync(
	'./api/pages-manifest.json',
	f.readFileSync('./.next/standalone/.next/server/pages-manifest.json', 'utf8'),
	'utf8',
);
f.writeFileSync(
	'./api/routes-manifest.json',
	f.readFileSync('./.next/standalone/.next/routes-manifest.json', 'utf8'),
	'utf8',
);

f.writeFileSync(
	'./api/webpack-api-runtime.js',
	f.readFileSync('./.next/standalone/.next/server/webpack-api-runtime.js', 'utf8'),
	'utf8',
);

f.writeFileSync('./api/function/bindings.js', f.readFileSync('./scripts/bindings.js', 'utf8'), 'utf8');
f.writeFileSync('./api/function/index.js', f.readFileSync('./scripts/handler.js', 'utf8'), 'utf8');

f.writeFileSync(
	'./api/function/function.json',
	JSON.stringify(
		{
			bindings: [
				{
					authLevel: 'anonymous',
					type: 'httpTrigger',
					direction: 'in',
					name: 'req',
					methods: ['get', 'post', 'put', 'options', 'delete', 'patch'],
					route: '{*all}',
				},
				{
					type: 'http',
					direction: 'out',
					name: 'res',
				},
			],
		},
		null,
		4,
	),
	'utf8',
);
f.writeFileSync(
	'./api/package.json',
	JSON.stringify(
		{
			name: 'api',
			version: '1.0.0',
			description: '',
			dependencies: {},
			devDependencies: {},
			engines: {
				node: '>=16.0.0',
			},
		},
		null,
		4,
	),
	'utf8',
);
