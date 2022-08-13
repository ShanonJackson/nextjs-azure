


export default function Page({hello}) {
	const helloworld = "HELLO WORLD";
	const CREATE_CODE = "CODE CODE"
	return (
		<div>HELLO {hello}</div>
	)
}

Page.getInitialProps = () => {
	return {
		hello: Math.random()
	}
}