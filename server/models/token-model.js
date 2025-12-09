module.exports = class TokenModel {
  id;
  email;
  password;
  isActivated;
  activationLink;
  constructor(id, email, password, isActivated, activationLink) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.isActivated = isActivated;
    this.activationLink = activationLink;
  }
};
