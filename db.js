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

User.beforeCreate(async (user) => {
  const hashed = await bcrypt.hash('password', 3)
  user.password = hashed;
});

User.byToken = async(token)=> {
  try {
    console.log('this is token', token)
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
    },
  });
  console.log('this is user', user)
  if (await bcrypt.compareSync(password, user.password)) {
    try {
      console.log('is this hitting')
      const token = jwt.sign( { id: user.id, username: user.username }, tokenSecret)
      console.log('is this token - from bcrypt', token)
    return token;}
    catch (err) {console.log('the bcrypt compare is errorring')}

}
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

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
