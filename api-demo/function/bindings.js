const staticPages = require('../pages-manifest.json');
const dynamicPages = require('../routes-manifest.json').dynamicRoutes;
const Stream = require('stream');
const http = require('http');

const router = (path) => {
	if (staticPages[path]) return { path: '../' + staticPages[path], query: {} };
	const dynamic = dynamicPages.find(({ regex }) => new RegExp(regex, 'i').test(path));
	if (dynamic) return { path: '../pages' + dynamic.page, query: path.match(dynamic.namedRegex).groups };
	return null;
};

module.exports = async (context, req) => {
	const uri =
		'/' +
		req.url
			.split('?')[0]
			.split('/')
			.slice(3)
			.join('/');
	const route = router(uri);
	if (!route) return { res: { status: 404 } };
	req.query = { ...route.query, ...req.query };
	const { req: nextreq, res: nextres, promise } = AzureCompat(context, req);
	require(route.path).default(nextreq, nextres);
	return promise;
};

const AzureCompat = (ctx, req) => {
	ctx.res = ctx.res || {};
	ctx.res.headers = ctx.res.headers || {};
	const newStream = new Stream.Readable();
	const request = Object.assign(newStream, http.IncomingMessage.prototype, {
		url: req.url,
		pathname:
			'/' +
			req.url
				.split('/')
				.slice(3)
				.join('/'),
		rawHeaders: [],
		headers: req.headers,
		method: req.method,
		log: ctx.log,
		body: req.body,
		query: req.query,
		getHeader: (name) => request.headers[name.toLowerCase()],
		getHeaders: () => req.headers,
		connection: {},
	});
	const res = Object.assign(new Stream(), {
		status: (code) => {
			ctx.res.status = code;
			return res;
		},
		writeHead: (status, headers) => {
			if (!ctx.res) return;
			ctx.res.status = status;
			if (headers) ctx.res.headers = Object.assign(ctx.res.headers, headers);
		},
		headers: {},
		write: (chunk) => {
			if (!ctx.res) return;
			ctx.res.body = chunk;
		},
		setHeader: (name, value) => {
			if (!ctx.res) return;
			return (ctx.res.headers[name.toLowerCase()] = value);
		},
		removeHeader: (name) => {
			if (!ctx.res) return;
			delete ctx.res.headers[name.toLowerCase()];
		},
		getHeader: (name) => {
			if (!ctx.res) return;
			return ctx.res.headers[name.toLowerCase()];
		},
		getHeaders: () => {
			if (!ctx.res) return;
			return ctx.res.headers;
		},
		hasHeader: (name) => !!res.getHeader(name),
	});
	Object.defineProperty(res, 'statusCode', {
		get() {
			if (!ctx.res) return;
			return ctx.res.status;
		},
		set(code) {
			if (!ctx.res) return;
			return (ctx.res.status = code);
		},
	});
	if (req.body) request.push(Buffer.from(JSON.stringify(req.body)), undefined);
	request.push(null);
	const promise = new Promise(function(resolve) {
		res.send = (text) => {
			if (typeof text === 'object') {
				res.setHeader('content-type', 'application/json');
			}
			if (ctx.res) ctx.res.body = text;
			resolve(ctx);
		};
		res.end = (text) => {
			if (ctx.res) ctx.res.body = text;
			resolve(ctx);
		};
	});
	return { req: request, res: res, promise: promise };
};
