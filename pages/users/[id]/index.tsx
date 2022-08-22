import {useRouter} from "next/router";

export default function Page({hello}: {hello: number}) {
	const router = useRouter();
	console.log(router.pathname)
	return (
		<div>hello {hello}</div>
	)
}

Page.getInitialProps = () => {
	return {
		hello: "users/[id] getInitialProps"
	}
}