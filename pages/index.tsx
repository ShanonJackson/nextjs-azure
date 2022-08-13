import {NextPageContext} from "next";


export default function Page({hello}: {hello: string})  {
	console.log(hello)
	return (
		<div>
			HELLO {hello}
		</div>
	)
}

Page.getInitialProps = (ctx: NextPageContext) => {
	return {
		hello: Math.random()
	}
}