import * as storage from '@pulumi/azure-native/storage';
import * as resources from '@pulumi/azure-native/resources';
import * as pulumi from '@pulumi/pulumi';

export class StorageUtils {
	static url(
		blob: storage.Blob,
		container: storage.BlobContainer,
		account: storage.StorageAccount,
		resourceGroup: resources.ResourceGroup,
	): pulumi.Output<string> {
		const blobSAS = storage.listStorageAccountServiceSASOutput({
			accountName: account.name,
			protocols: storage.HttpProtocol.Https,
			sharedAccessExpiryTime: '2030-01-01',
			sharedAccessStartTime: '2021-01-01',
			resourceGroupName: resourceGroup.name,
			resource: storage.SignedResource.C,
			permissions: storage.Permissions.R,
			canonicalizedResource: pulumi.interpolate`/blob/${account.name}/${container.name}`,
			contentType: 'application/json',
			cacheControl: 'max-age=5',
			contentDisposition: 'inline',
			contentEncoding: 'deflate',
		});
		return pulumi.interpolate`https://${account.name}.blob.core.windows.net/${container.name}/${blob.name}?${blobSAS.serviceSasToken}`;
	}
	static connection(
		resourceGroupName: pulumi.Input<string>,
		accountName: pulumi.Input<string>,
	): pulumi.Output<string> {
		const storageAccountKeys = storage.listStorageAccountKeysOutput({ resourceGroupName, accountName });
		return pulumi.interpolate`DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${(storageAccountKeys.keys[0].value)}`;
	}
}
