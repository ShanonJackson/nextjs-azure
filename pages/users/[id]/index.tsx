import {useRouter} from "next/router";

export default function Page({hello}: {hello: number}) {
	const router = useRouter();
	console.log(router.pathname)
	return (
		<div>hello {hello}</div>
	)
}
