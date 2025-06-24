import { FC } from 'hono/jsx';

const Dashboard: FC = () => (
	<main>
		<h1>Admin Dashboard</h1>
		<p>Welcome to the Pick-a-Bot cron admin dashboard.</p>
		<ul>
			<li>
				<a href="/config">Manage Configuration</a>
			</li>
		</ul>
	</main>
);
export default Dashboard;
