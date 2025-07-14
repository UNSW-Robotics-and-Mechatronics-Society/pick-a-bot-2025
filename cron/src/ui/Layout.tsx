import { FC } from 'hono/jsx';

export interface SiteData {
	title: string;
	description: string;
	children?: any;
}

const Layout: FC<SiteData> = (props: SiteData) => {
	return (
		<html>
			<head>
				<meta charset="UTF-8" />
				<title>{props.title}</title>
				<link rel="icon" href="/favicon.ico" />
				<link rel="stylesheet" href="/global.css" />
				<meta name="description" content={props.description} />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body>{props.children}</body>
		</html>
	);
};

export default Layout;
