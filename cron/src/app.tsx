import { Hono } from 'hono';
import api from './routes/api';
import root from './routes/root';

export const app = new Hono<{ Bindings: Env }>();

app.route('/', root);

app.route('/api', api);
