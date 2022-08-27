import * as pulumi from '@pulumi/pulumi';
import {insights, storage, web} from "@pulumi/azure-native";
import { Blob } from "@pulumi/azure/storage/blob";
import {StorageUtils} from "./storage";
import {rg} from "./resource-group";
import glob from "fast-glob";

const config = new pulumi.Config();
const storageAccount = new storage.StorageAccount('sa', {
	resourceGroupName: rg.name,
	sku: {
		name: storage.SkuName.Standard_LRS,
	},
	kind: storage.Kind.StorageV2,
});

const codeContainer = new storage.BlobContainer('zips', {
	resourceGroupName: rg.name,
	accountName: storageAccount.name,

});

const uiBackendCode = new storage.Blob('ui-backend', {
	resourceGroupName: rg.name,
	accountName: storageAccount.name,
	containerName: codeContainer.name,
	source: new pulumi.asset.FileArchive('../ui-backend'),
});

const apiBackendCode = new storage.Blob('api-backend', {
	resourceGroupName: rg.name,
	accountName: storageAccount.name,
	containerName: codeContainer.name,
	source: new pulumi.asset.FileArchive('../api'),
});

const plan = new web.AppServicePlan('plan', {
	resourceGroupName: rg.name,
	kind: 'Linux',
	sku: {
		name: 'Y1',
		tier: 'Dynamic',
	},
	reserved: true,
});

const frontendStorage = new storage.StorageAccount("frontendsa", {
	enableHttpsTrafficOnly: true,
	kind: storage.Kind.StorageV2,
	resourceGroupName: rg.name,
	sku: {
		name: storage.SkuName.Standard_LRS,
	},
});

const webstatic = new storage.StorageAccountStaticWebsite("staticwebsite", {
	accountName: frontendStorage.name,
	resourceGroupName: rg.name,
	indexDocument: "index",
	error404Document: "404",
});
export const frontend_url = frontendStorage.primaryEndpoints.apply(ep => ep.web.replace("https://", "").replace("/", ""));
const files = glob.sync("../out/**/*").map((f) => {
	const sanitized = f.replace("../out/", "").replace(".html", "");
	const contentType = (() => {
		if(f.endsWith(".js")) return "text/javascript";
		if(f.endsWith(".html")) return "text/html";
		if(f.endsWith(".css")) return "text/css";
		return undefined;
	})();
	return new Blob(sanitized, {
		name: sanitized,
		type: "Block",
		cacheControl: contentType === "text/html" ? "public, must-revalidate, max-age=30" : "public, max-age=604800, immutable",
		storageAccountName: frontendStorage.name,
		storageContainerName: webstatic.containerName,
		source: new pulumi.asset.FileAsset(f),
		contentType
	});
})



const uiBackendAi = new insights.Component('ai', {
	resourceGroupName: rg.name,
	kind: 'web',
	applicationType: insights.ApplicationType.Web,
});

export const uiBackend = new web.WebApp('ui-backend', {
	resourceGroupName: rg.name,
	serverFarmId: plan.id,
	kind: 'functionapp',
	siteConfig: {
		appSettings: [
			{
				name: 'APPINSIGHTS_INSTRUMENTATIONKEY',
				value: uiBackendAi.instrumentationKey,
			},
			{
				name: 'APPLICATIONINSIGHTS_CONNECTION_STRING',
				value: pulumi.interpolate`InstrumentationKey=${uiBackendAi.instrumentationKey}`,
			},
			{
				name: 'ApplicationInsightsAgent_EXTENSION_VERSION',
				value: '~2',
			},
			{ name: 'AzureWebJobsStorage', value: StorageUtils.connection(rg.name, storageAccount.name) },
			{ name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' },
			{ name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' },
			{ name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~16' },
			{ name: 'WEBSITE_RUN_FROM_PACKAGE', value: StorageUtils.url(uiBackendCode, codeContainer, storageAccount, rg) },
			{ name: "VERSION", value: "2"}
		],
		http20Enabled: true,
		linuxFxVersion: 'node|16',
		nodeVersion: '~16',
	},
});

export const apiBackend = new web.WebApp('api-backend', {
	resourceGroupName: rg.name,
	serverFarmId: plan.id,
	kind: 'functionapp',
	siteConfig: {
		appSettings: [
			{ name: 'AzureWebJobsStorage', value: StorageUtils.connection(rg.name, storageAccount.name) },
			{ name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' },
			{ name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' },
			{ name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~16' },
			{ name: 'WEBSITE_RUN_FROM_PACKAGE', value: StorageUtils.url(apiBackendCode, codeContainer, storageAccount, rg) },
		],
		http20Enabled: true,
		linuxFxVersion: 'node|16',
		nodeVersion: '~16',
	},
});



export const url = frontend_url;