import {cdn} from "@pulumi/azure-native";
import * as pulumi from '@pulumi/pulumi';
import * as random from "@pulumi/random";
import {rg} from "./resource-group";
import {apiBackend, frontend, uiBackend} from "./web";


const config = new pulumi.Config();

const GLOBALLY_UNIQUE = new random.RandomId("random-id", {byteLength: 5});
const FRONT_DOOR_NAME = pulumi.interpolate`frontdoor${GLOBALLY_UNIQUE.hex}`;
const PROVIDERS = pulumi.interpolate`/subscriptions/${config.require("SUBSCRIPTION_ID")}/resourceGroups/${rg.name}/providers`;


const fd = new cdn.Profile("frontdoor", {
	profileName: "frontdoor",
	resourceGroupName: rg.name,
	location: "global",
	sku: {
		name: cdn.SkuName.Standard_AzureFrontDoor
	}
});

/* ui-backend handlers */
const ui_backend_origin_group = new cdn.AFDOriginGroup("ui-backend-origin-group", {
	healthProbeSettings: {
		probeIntervalInSeconds: 100,
		probePath: "/",
		probeProtocol: cdn.ProbeProtocol.Https,
		probeRequestType: cdn.HealthProbeRequestType.HEAD,
	},
	loadBalancingSettings: {
		additionalLatencyInMilliseconds: 50,
		sampleSize: 4,
		successfulSamplesRequired: 3,
	},
	originGroupName: "ui-backend-origin-group",
	profileName: fd.name,
	resourceGroupName: rg.name,
	sessionAffinityState: "Disabled",
});

const ui_backend_origin = new cdn.AFDOrigin("ui-backend-origin", {
	originName: "ui-backend-origin",
	hostName: uiBackend.hostNames[0],
	resourceGroupName: rg.name,
	enabledState: "Enabled",
	httpPort: 80,
	httpsPort: 443,
	originGroupName: ui_backend_origin_group.name,
	originHostHeader: uiBackend.hostNames[0],
	priority: 1,
	weight: 1000,
	profileName: fd.name
})

const ui_backend_endpoint = new cdn.AFDEndpoint("ui-backend-endpoint", {
	enabledState: "Enabled",
	endpointName: "ui-backend-endpoint",
	location: fd.location,
	profileName: fd.name,
	resourceGroupName: rg.name,
});

const ui_backend_route = new cdn.Route("ui-backend-route", {
	profileName: fd.name,
	resourceGroupName: rg.name,
	endpointName: ui_backend_endpoint.name,
	patternsToMatch: ["/*"],
	enabledState: "Enabled",
	supportedProtocols: ["Http", "Https"],
	forwardingProtocol: "HttpsOnly",
	httpsRedirect: "Enabled",
	linkToDefaultDomain: "Enabled",
	originGroup: {
		id: ui_backend_origin_group.id,
	},
	ruleSets: []
});

/* fontend handlers */
const frontend_origin_group = new cdn.AFDOriginGroup("frontend-origin-group", {
	healthProbeSettings: {
		probeIntervalInSeconds: 100,
		probePath: "/",
		probeProtocol: cdn.ProbeProtocol.Https,
		probeRequestType: cdn.HealthProbeRequestType.HEAD,
	},
	loadBalancingSettings: {
		additionalLatencyInMilliseconds: 50,
		sampleSize: 4,
		successfulSamplesRequired: 3,
	},
	originGroupName: "frontend-origin-group",
	profileName: fd.name,
	resourceGroupName: rg.name,
	sessionAffinityState: "Disabled",
});

const frontend_origin = new cdn.AFDOrigin("frontend-origin", {
	originName: "frontend-origin",
	hostName: frontend.defaultHostname,
	resourceGroupName: rg.name,
	enabledState: "Enabled",
	httpPort: 80,
	httpsPort: 443,
	originGroupName: frontend_origin_group.name,
	originHostHeader: frontend.defaultHostname,
	priority: 1,
	weight: 1000,
	profileName: fd.name
})

const frontend_endpoint = new cdn.AFDEndpoint("frontend-endpoint", {
	enabledState: "Enabled",
	endpointName: "frontend-endpoint",
	location: fd.location,
	profileName: fd.name,
	resourceGroupName: rg.name,
});

const frontend_origin_route = new cdn.Route("frontend-route", {
	profileName: fd.name,
	resourceGroupName: rg.name,
	endpointName: frontend_endpoint.name,
	routeName: "frontend-route",
	patternsToMatch: ["/*"],
	enabledState: "Enabled",
	supportedProtocols: ["Http", "Https"],
	forwardingProtocol: "HttpsOnly",
	httpsRedirect: "Enabled",
	linkToDefaultDomain: "Enabled",
	originGroup: {
		id: frontend_origin_group.id,
	},
	ruleSets: []
}, {dependsOn: [frontend_origin]});

/* api backend */
const api_backend_origin_group = new cdn.AFDOriginGroup("api-backend-origin-group", {
	healthProbeSettings: {
		probeIntervalInSeconds: 100,
		probePath: "/",
		probeProtocol: cdn.ProbeProtocol.Https,
		probeRequestType: cdn.HealthProbeRequestType.HEAD,
	},
	loadBalancingSettings: {
		additionalLatencyInMilliseconds: 50,
		sampleSize: 4,
		successfulSamplesRequired: 3,
	},
	originGroupName: "api-backend-origin-group",
	profileName: fd.name,
	resourceGroupName: rg.name,
	sessionAffinityState: "Disabled",
});

const api_backend_origin = new cdn.AFDOrigin("api-backend-origin", {
	originName: "api-backend-origin",
	hostName: apiBackend.hostNames[0],
	resourceGroupName: rg.name,
	enabledState: "Enabled",
	httpPort: 80,
	httpsPort: 443,
	originGroupName: api_backend_origin_group.name,
	originHostHeader: apiBackend.hostNames[0],
	priority: 1,
	weight: 1000,
	profileName: fd.name
})

const api_backend_endpoint = new cdn.AFDEndpoint("api-backend-endpoint", {
	enabledState: "Enabled",
	endpointName: "api-backend-endpoint",
	location: fd.location,
	profileName: fd.name,
	resourceGroupName: rg.name,
});

const api_backend_route = new cdn.Route("api-backend-route", {
	profileName: fd.name,
	resourceGroupName: rg.name,
	endpointName: api_backend_endpoint.name,
	patternsToMatch: ["/*"],
	enabledState: "Enabled",
	supportedProtocols: ["Http", "Https"],
	forwardingProtocol: "HttpsOnly",
	httpsRedirect: "Enabled",
	linkToDefaultDomain: "Enabled",
	originGroup: {
		id: api_backend_origin_group.id,
	},
	ruleSets: []
}, {dependsOn: [api_backend_origin]});