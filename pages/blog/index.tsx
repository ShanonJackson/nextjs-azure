import {useRouter} from "next/router";

export default function Page({hello}: {hello: number}) {
	const router = useRouter();
	return (
		<div>{hello}</div>
	)
}

Page.getInitialProps = () => {
	return {
		hello: "Blog getInitialProps"
	}
}