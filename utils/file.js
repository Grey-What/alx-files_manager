import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from './db';
import userUtils from './user';
import basicUtils from './basic';


const fileUtils = {

  async checkFileBody(req) {
    const {
      name, type, isPublic = false, data,
    } = req.body;

    let { parentId = 0 } = req.body;

    const allowedTypes = ['file', 'image', 'folder'];
    let errorMsg = null;

    if (parentId === '0') parentId = 0;

    if (!name) {
      errorMsg = 'Missing name';
    } else if (!type || !allowedTypes.includes(type)) {
      errorMsg = 'Missing or invalid type';
    } else if (!data && type !== 'folder') {
      errorMsg = 'Missing data';
    } else if (parentId && parentId !== '0') {
      let parentFile;

      if (utilityHelper.isIdValid(parentId)) {
        parentFile = await this.retrieveFile({
          _id: ObjectId(parentId),
        });
      } else {
        parentFile = null;
      }

      if (!parentFile) {
        errorMsg = 'Parent not found';
      } else if (parentFile.type !== 'folder') {
        errorMsg = 'Parent is not a folder';
      }
    }

    return {
      error: errorMsg,
      fileDetails: {
        name,
        type,
        parentId,
        isPublic,
        data,
      },
    };
  },


  async retrieveFile(filter) {
    return await dbClient.filesCollection.findOne(filter);
  },

  async getFilesByParentId(query) {
    return await dbClient.filesCollection.aggregate(query);
  },

  async storeFile(userId, fileDetails, pathToFolder) {
    const {
      name, type, isPublic, data,
    } = fileDetails;
    let { parentId } = fileDetails;

    if (parentId !== 0) parentId = ObjectId(parentId);

    const fileData = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    if (fileDetails.type !== 'folder') {
      const fileName = uuidv4();
      const fileContent = Buffer.from(data, 'base64');
      const filePath = `${pathToFolder}/${fileName}`;

      fileData.localPath = filePath;

      try {
        await fsPromises.mkdir(pathToFolder, { recursive: true });
        await fsPromises.writeFile(filePath, fileContent);
      } catch (error) {
        return { error: error.message, code: 400 };
      }
    }

    const result = await dbClient.filesCollection.insertOne(fileData);
    const savedFile = this.formatFileData(fileData);
    const finalFile = { id: result.insertedId, ...savedFile };

    return { error: null, finalFile };
  },

  async modifyFile(filter, updateData) {
    return await dbClient.filesCollection.findOneAndUpdate(
      filter,
      updateData,
      { returnOriginal: false },
    );
  },

  async toggleFileVisibility(req, setVisibility) {
    const { id: fileId } = req.params;

    if (!utilityHelper.isIdValid(fileId)) { return { error: 'Unauthorized', code: 401 }; }

    const { userId } = await userHelper.getUserIdAndSessionKey(req);

    if (!utilityHelper.isIdValid(userId)) { return { error: 'Unauthorized', code: 401 }; }

    const user = await userHelper.findUserById(ObjectId(userId));

    if (!user) return { error: 'Unauthorized', code: 401 };

    const file = await this.retrieveFile({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!file) return { error: 'Not found', code: 404 };

    const updatedFile = await this.modifyFile(
      { _id: ObjectId(fileId), userId: ObjectId(userId) },
      { $set: { isPublic: setVisibility } }
    );

    const {
      _id: id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    } = updatedFile.value;

    return {
      error: null,
      code: 200,
      updatedFile: { id, userId: resultUserId, name, type, isPublic, parentId },
    };
  },

  formatFileData(fileDoc) {
    const formattedFile = { id: fileDoc._id, ...fileDoc };
    delete formattedFile.localPath;
    delete formattedFile._id;
    return formattedFile;
  },

  verifyOwnershipAndVisibility(file, userId) {
    if (
      (!file.isPublic && !userId)
      || (userId && file.userId.toString() !== userId && !file.isPublic)
    ) {
      return false;
    }
    return true;
  },

  async fetchFileData(file, size) {
    let filePath = file.localPath;
    if (size) filePath = `${filePath}_${size}`;

    try {
      const fileData = await fsPromises.readFile(filePath);
      return { data: fileData };
    } catch (error) {
      return { error: 'Not found', code: 404 };
    }
  },
};

export default fileUtils;
