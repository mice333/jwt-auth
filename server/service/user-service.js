const pool = require("../db/db");
const bcrypt = require("bcrypt");

class UserService {
  async registration(email, password) {
    const candidate = await pool
      .query("SELECT email FROM users WHERE users.email = $1", [email])
      .then((e) => e.rows);
    console.log(candidate);

    if (candidate.length > 0) {
      throw new Error(
        `Пользователь с почтовым адресом ${email} уже существует`
      );
    }
    const hashPassword = await bcrypt.hash(password, 3);
    const user = await pool
      .query("INSERT INTO users(email, password) VALUES ($1, $2) RETURNING *", [
        email,
        hashPassword,
      ])
      .then((e) => e.rows);
    console.log(user);

    // TODO activation link
  }
}

module.exports = new UserService();
