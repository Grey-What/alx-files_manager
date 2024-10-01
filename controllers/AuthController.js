import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import userUtils from '../utils/user';

class AuthController {
  
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization') || '';

    const creds = authHeader.split(' ')[1];

    if (!creds) { return res.status(401).send({ error: 'Unauthorized' }); }

    const decodedCreds = Buffer.from(creds, 'base64').toString(
      'utf-8',
    );

    const [email, password] = decodedCreds.split(':');

    if (!email || !password) { return res.status(401).send({ error: 'Unauthorized' }); }

    const sha1Pwd = sha1(password);

    const user = await userUtils.getUser({
      email,
      password: sha1Pwd,
    });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    const hoursForExpiration = 24;

    await redisClient.set(key, user._id.toString(), hoursForExpiration * 3600);

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const { userId, key } = await userUtils.getUserIdAndKey(req);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(key);

    return res.status(204).send();
  }
}

export default AuthController;
