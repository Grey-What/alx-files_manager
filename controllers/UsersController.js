import shai from 'sha1';
import Queue from 'bull/lib/queue';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const usrQueue = new Queue('email-sending');

export default class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const usr = await (await dbClient.usersCollection()).findOne({ email });

    if (usr) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const insertion = await (await dbClient.usersCollection())
      .insertOne({ email, password: shai(password) });
    const usrId = insertion.insertedId.toString();

    usrQueue.add({ usrId });
    res.status(201).json({ email, id: usrId });
  }

  static async getMe(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);

    const user = await userUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const pUser = { id: user._id, ...user };
    delete pUser._id;
    delete pUser.password;

    return res.status(200).send(pUser);
  }
}
