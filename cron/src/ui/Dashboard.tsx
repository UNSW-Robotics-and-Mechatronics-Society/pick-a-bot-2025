import { FC } from 'hono/jsx';
import { CRON_URLS } from '../lib/constants';

export type Environment = 'local' | 'dev' | 'prod';

interface DashboardProps {
	environment: Environment;
}

const Dashboard: FC<DashboardProps> = ({ environment }) => {
	const cron_url = CRON_URLS[environment];
	return (
		<main>
			<div style="display: inline-flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
				<h1>Admin Dashboard</h1>
				<p style="color: #999999; font-weight: bold; background-color: #222222; padding: 0.5rem; border-radius: 4px; width: fit-content;">
					{environment}
				</p>
			</div>
			<p>Welcome to the Pick-a-Bot cron admin dashboard.</p>
			<ul>
				<li>
					<a href="/config">Manage Configuration</a>
				</li>
				<li>
					<a href={cron_url}>View Cron Jobs</a>
				</li>
			</ul>
		</main>
	);
};
export default Dashboard;
