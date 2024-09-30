import shai from 'sha1';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';

const usrQueue = new Queue('email sending');

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
    const usrId = insertion.InsertedId.toString();

    usrQueue.add({ usrId });
    res.status(201).json({ email, id: usrId });
  }

  static async getInfo(req, res) {
    const { usr } = req;
    res.status(200).json({ email: usr.email, id: usr._id.toString() });
  }
}
