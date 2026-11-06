import { db } from '../server/database/db.js';

try {
  const res = db.prepare('SELECT title, role, user_id, COUNT(*) as cnt FROM notifications GROUP BY title, role, user_id').all();
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  console.error(e);
}
