const pool = require("../db/db");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const mailService = require("./mail-service");
const tokenService = require("./token-service");
const UserModel = require("../models/user-model");
const UserDto = require("../dtos/user-dto");

class UserService {
  async registration(email, password) {
    const candidate = await pool
      .query("SELECT email FROM users WHERE users.email = $1", [email])
      .then((e) => e.rows[0]);
    console.log(candidate);

    if (candidate) {
      throw new Error(
        `Пользователь с почтовым адресом ${email} уже существует`
      );
    }

    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4();
    const user = await pool
      .query(
        "INSERT INTO users(email, password, activation_link) VALUES ($1, $2, $3) RETURNING *",
        [email, hashPassword, activationLink]
      )
      .then(
        (e) =>
          new UserModel(
            e.rows[0].id,
            e.rows[0].email,
            e.rows[0].password,
            e.rows[0].is_activated,
            e.rows[0].activation_link
          )
      );
    console.log(user);

    await mailService.sendActivationMail(email, activationLink);
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }
}

module.exports = new UserService();
