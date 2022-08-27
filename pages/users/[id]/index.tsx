import {useRouter} from "next/router";

export default function Page({hello}: {hello: number}) {
	const router = useRouter();
	console.log(router.pathname)
	return (
		<div>CACHE BUSTING {hello}</div>
	)
}

export const getServerSideProps = () => {
	return {
		props: {
			hello: "users/[id] getServerSideProps"
		}
	}
}