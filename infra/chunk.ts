/*
	Takes input Array (i.e array of 100 numbers) and chunk size say 20.
	produces a new array with nested arrays of that batch size.
 */

export const chunk = <T>(arr: T[], size: number) => {
	return arr.reduce<T[][]>((output, item, index) => {
		const chunkIndex = Math.floor(index / size)
		if (!output[chunkIndex]) output[chunkIndex] = [];
		output[chunkIndex].push(item)
		return output;
	}, []);
}