const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt')
const config = {
  logging: false
};

const tokenSecret = process.env.JWT;


if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.byToken = async(token)=> {
  try {
    const verifiedToken = jwt.verify(token, tokenSecret);
    console.log('verified token', verifiedToken);
    const user = await User.findByPk(verifiedToken.id);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username,
      password
    },
  });
  if(user){
    const token = jwt.sign( { id: user.id, username: user.username }, tokenSecret)
    return token;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate(user => {
    const hashed = bcrypt.hash('password', 3)
    user.password = hashed; 
  });

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};
