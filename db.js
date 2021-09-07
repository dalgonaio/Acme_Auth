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
  const hashed = await bcrypt.hash(user.password, 3)
  user.password = hashed;
});

User.byToken = async(token)=> {
  try {
    const verifiedToken = jwt.verify(token, tokenSecret);
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
  if(user){
    const match = await bcrypt.compareSync(password, user.password)
    if(match){
      const token = jwt.sign( { id: user.id, username: user}, tokenSecret)
      console.log(token)
    return token
    }
  }

  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const Notes = conn.define('notes', {
  text:{
    type: Sequelize.STRING
  }
})

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
  const theNotes = [
    { text: 'this is lucy'},
    { text: 'this is moe'},
    { text: 'this is larry'}
  ];
  const [lucyNote, moeNote, larryNote] = await Promise.all(
    theNotes.map( note => Notes.create(note)))
    console.log(lucy)
    await lucy.setNotes(lucyNote),
    await moe.setNotes(moeNote),
    await larry.setNotes(larryNote)
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

Notes.belongsTo(User)
User.hasMany(Notes)

module.exports = {
  syncAndSeed,
  models: {
    User,
    Notes
  }
};
