/**
 * DBClient - Database client (MongoDB)
 */

import { MongoClient } from 'mongodb';

class DBClient {
  /**
   * Connects to the MongoDB database
   */
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017; // port = process.env.DB_PORT || 27017;
    this.dbName = process.env.DB_NAME || 'files_manager';

    this.url = `mongodb://${this.host}:${this.port}/${this.dbName}`;
    this.client = new MongoClient(this.url, { useUnifiedTopology: true });
    this.isConnected = false;

    this.client.connect().then(() => {
      this.isConnected = true;
    }).catch((err) => {
      console.log(err);
    });
  }

  /**
   * Checks if the database is alive
   * @returns {Promise<boolean>}
   */
  isAlive() {
    return this.isConnected;
  }

  /**
   * Retrieves the total number of users in the database.
   *
   * @return {number} The total number of users.
   */
  async nbUsers() {
    if (!this.isConnected) {
      console.log('DB is not connected');
      await this.client.connect();
    }
    const usersCount = await this.client.db(this.dbName).collection('users').countDocuments();
    return usersCount;
  }

  /**
   * Retrieves the total number of files in the database.
   *
   * @return {Promise<number>} The total number of files.
   */
  async nbFiles() {
    if (!this.isConnected) {
      console.log('DB is not connected');
      await this.clientconnect();
    }
    const filesCount = await this.client.db(this.dbName).collection('files').countDocuments();
    return filesCount;
  }
}

const dbClient = new DBClient();
export default dbClient;
