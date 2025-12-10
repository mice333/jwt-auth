const pool = require("../db/db");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const mailService = require("./mail-service");
const tokenService = require("./token-service");
const UserModel = require("../models/user-model");
const UserDto = require("../dtos/user-dto");
const ApiError = require("../exceptions/api-error");

class UserService {
  async registration(email, password) {
    const candidate = await pool
      .query("SELECT email FROM users WHERE users.email = $1", [email])
      .then((e) => e.rows[0]);
    console.log(candidate);

    if (candidate) {
      throw ApiError.BadRequest(
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

    await mailService.sendActivationMail(
      email,
      `${process.env.API_URL}/api/activate/${activationLink}`
    );
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  async activate(activationLink) {
    const user = await pool
      .query("SELECT * FROM users WHERE activation_link = $1", [activationLink])
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

    if (!user) {
      throw ApiError.BadRequest("Неккоректная ссылка активации");
    }
    user.isActivated = true;
    await pool.query("UPDATE users SET is_activated = true WHERE id = $1", [
      user.id,
    ]);
  }

  async login(email, password) {
    const user = await pool
      .query("SELECT * FROM users WHERE email = $1", [email])
      .then((e) =>
        e.rows[0] === undefined
          ? undefined
          : new UserModel(
              e.rows[0].id,
              e.rows[0].email,
              e.rows[0].password,
              e.rows[0].is_activated,
              e.rows[0].activation_link
            )
      );
    console.log(user);

    if (!user) {
      throw ApiError.BadRequest("Пользователь не был найден");
    }
    const isPassEquals = await bcrypt.compare(password, user.password);
    console.log(isPassEquals);

    if (!isPassEquals) {
      throw ApiError.BadRequest("Неверный пароль");
    }
    const userDto = new UserDto(user);
    console.log(userDto);

    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return { ...tokens, user: userDto };
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnathorizedError();
    }
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);
    if (!tokenFromDb || !userData) {
      throw ApiError.UnathorizedError();
    }
    const user = await pool
      .query("SELECT * FROM users WHERE id = $1", [userData.id])
      .then((e) =>
        e.rows[0] === undefined
          ? undefined
          : new UserModel(
              e.rows[0].id,
              e.rows[0].email,
              e.rows[0].password,
              e.rows[0].is_activated,
              e.rows[0].activation_link
            )
      );
    const userDto = new UserDto(user);
    console.log(userDto);

    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return { ...tokens, user: userDto };
  }

  async getAllUsers() {
    const users = await pool.query("SELECT * FROM users").then((e) => e.rows);
    return users;
  }
}

module.exports = new UserService();
