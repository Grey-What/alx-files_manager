import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';
import userUtils from '../utils/user';
import fileUtils from '../utils/file';
import basicUtils from '../utils/basic';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const fileQueue = new Queue('fileQueue');

class FilesController {

  static async postUpload(req, res) {
    const { usrId } = await userUtils.getUserIdAndKey(req);

    if (!basicUtils.isIdValid(usrId)) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (!usrId && req.body.type === 'image') {
      await fileQueue.add({});
    }

    const usr = await userUtils.getUser({
      _id: ObjectId(usrId),
    });

    if (!usr) return res.status(401).send({ error: 'Unauthorized' });

    const { error: validationError, fileParams } = await fileUtils.checkBodyValidity(
      req,
    );

    if (validationError) { return res.status(400).send({ error: validationError }); }

    if (fileParams.parentId !== 0 && !basicUtils.isValidId(fileParams.parentId)) { return res.status(400).send({ error: 'Parent not found' }); }

    const { error, code, newFile } = await fileUtils.storeFile(
      usrId,
      fileParams,
      FOLDER_PATH,
    );

    if (error) {
      if (res.body.type === 'image') await fileQueue.add({ usrId });
      return res.status(code).send(error);
    }

    if (fileParams.type === 'image') {
      await fileQueue.add({
        fileId: newFile.id.toString(),
        userId: newFile.usrId.toString(),
      });
    }

    return res.status(201).send(newFile);
  }

  static async getShow(req, res) {
    const fileId = req.params.id;

    const { usrId } = await userUtils.getUserIdAndKey(req);

    const usr = await userUtils.getUser({
      _id: ObjectId(usrId),
    });

    if (!usr) return res.status(401).send({ error: 'Unauthorized' });

    if (!basicUtils.isValidId(fileId) || !basicUtils.isValidId(usrId)) { return res.status(404).send({ error: 'Not found' }); }

    const result = await fileUtils.fetchFile({
      _id: ObjectId(fileId),
      userId: ObjectId(usrId),
    });

    if (!result) return res.status(404).send({ error: 'Not found' });

    const file = fileUtils.transformFile(result);

    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const { usrId } = await userUtils.getUserIdAndKey(req);

    const usr = await userUtils.getUser({
      _id: ObjectId(usrId),
    });

    if (!usr) return res.status(401).send({ error: 'Unauthorized' });

    let parentId = request.query.parentId || '0';

    if (parentId === '0') parentId = 0;

    let page = Number(req.query.page) || 0;

    if (Number.isNaN(page)) page = 0;

    if (parentId !== 0 && parentId !== '0') {
      if (!basicUtils.isValidId(parentId)) { return res.status(401).send({ error: 'Unauthorized' }); }

      parentId = ObjectId(parentId);

      const folder = await fileUtils.fetchFile({
        _id: ObjectId(parentId),
      });

      if (!folder || folder.type !== 'folder') { return res.status(200).send([]); }
    }

    const pline = [
      { $match: { parentId } },
      { $skip: page * 20 },
      {
        $limit: 20,
      },
    ];

    const fileCursor = await fileUtils.fetchFilesByParentId(pline);

    const fileL = [];
    await fileCursor.forEach((doc) => {
      const document = fileUtils.transformFile(doc);
      fileL.push(document);
    });

    return res.status(200).send(fileL);
  }

  static async putPublish(req, res) {
    const { error, code, updatedFile } = await fileUtils.togglePublishStatus(
      req,
      true,
    );

    if (error) return res.status(code).send({ error });

    return res.status(code).send(updatedFile);
  }

  static async putUnpublish(request, response) {
    const { error, code, updatedFile } = await fileUtils.togglePublishStatus(
      req,
      false,
    );

    if (error) return res.status(code).send({ error });

    return res.status(code).send(updatedFile);
  }

  static async getFile(req, res) {
    const { usrId } = await userUtils.getUserIdAndKey(req);
    const { id: fileId } = request.params;
    const size = req.query.size || 0;

    if (!basicUtils.isValidId(fileId)) { return res.status(404).send({ error: 'Not found' }); }

    const file = await fileUtils.fetchFile({
      _id: ObjectId(fileId),
    });

    if (!file || !fileUtils.checkOwnershipAndPublicStatus(file, usrId)) { return res.status(404).send({ error: 'Not found' }); }

    if (file.type === 'folder') {
      return res
        .status(400)
        .send({ error: "A folder doesn't have content" });
    }

    const { error, code, data } = await fileUtils.fetchFileData(file, size);

    if (error) return res.status(code).send({ error });

    const mimeType = mime.contentType(file.name);

    res.setHeader('Content-Type', mimeType);

    return res.status(200).send(data);
  }
}
export default FilesController;
