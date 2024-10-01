import redisClient from './redis';
import dbClient from './db';

const userUtils = {

  async getUserIdAndKey(req) {
    const obj = { userId: null, key: null };

    const tokenX = req.header('X-Token');

    if (!tokenX) return obj;

    obj.key = `auth_${tokenX}`;

    obj.userId = await redisClient.get(obj.key);

    return obj;
  },

  async getUser(query) {
    const collection = await dbClient.usersCollection();
    const user = await collection.findOne(query);
    return user;
  },
};

export default userUtils;
