const jwt = require("jsonwebtoken");
const pool = require("../db/db");
class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "30m",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });

    return { accessToken, refreshToken };
  }

  async saveToken(userId, refreshToken) {
    const tokenData = await pool
      .query("SELECT * FROM tokens WHERE user_id = $1", [userId])
      .then((e) => e.rows);
    if (tokenData.length > 0) {
      await pool.query(
        "UPDATE tokens SET refreshtoken = $1 WHERE user_id = $2 ",
        [refreshToken, userId]
      );
      return;
    }
    const token = await pool.query(
      "INSERT INTO tokens(user_id, refreshtoken) VALUES ($1,$2)",
      [userId, refreshToken]
    );
    return token;
  }
}

module.exports = new TokenService();
