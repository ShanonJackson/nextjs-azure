import * as pulumi from '@pulumi/pulumi';
import {insights, storage, web} from "@pulumi/azure-native";
import {StorageUtils} from "./storage";
import {rg} from "./resource-group";


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

export const frontend = new web.StaticSite("nextjs-demo", {
	buildProperties: {
		appLocation: "out",
	},
	location: "West US 2",
	name: "nextjs-demo",
	repositoryToken: config.require("gh_token"),
	repositoryUrl: "https://github.com/ShanonJackson/nextjs-azure",
	branch: "main",
	resourceGroupName: rg.name,
	sku: {
		name: "Standard",
		tier: "Standard",
	},
});

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



export const url = frontend.defaultHostname;