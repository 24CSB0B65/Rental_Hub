const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function notify(userId, message) {
  db.prepare(
    `INSERT INTO notifications (id, user_id, message) VALUES (?, ?, ?)`
  ).run(uuidv4(), userId, message);
}

module.exports = { notify };
