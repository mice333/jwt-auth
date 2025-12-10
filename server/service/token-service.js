const jwt = require("jsonwebtoken");
const pool = require("../db/db");
class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "30s",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });

    return { accessToken, refreshToken };
  }

  validateAccessToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      return userData;
    } catch (e) {
      return null;
    }
  }

  validateRefreshToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      return userData;
    } catch (e) {
      return null;
    }
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

  async removeToken(refreshToken) {
    const tokenData = await pool
      .query("DELETE FROM tokens WHERE refreshtoken = $1 RETURNING *", [
        refreshToken,
      ])
      .then((e) => e.rows[0]);
    return tokenData;
  }

  async findToken(refreshToken) {
    const tokenData = await pool
      .query("SELECT refreshtoken FROM tokens WHERE refreshtoken = $1", [
        refreshToken,
      ])
      .then((e) => e.rows[0]);
    return tokenData;
  }
}

module.exports = new TokenService();
