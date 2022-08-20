import {useRouter} from "next/router";

export default function Page({hello}: {hello: number}) {
	const router = useRouter();
	console.log(router.pathname)
	return (
		<div>HELLO {hello}</div>
	)
}

Page.getInitialProps = () => {
	return {
		hello: "GetInitialProps"
	}
}