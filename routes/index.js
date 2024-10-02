import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const addRoutes = (api) => {
  api.get('/status', AppController.getStatus);
  api.get('/stats', AppController.getStats);
  api.get('/connect', AuthController.getConnect);
  api.get('/disconnect', AuthController.getDisconnect);
  api.get('/users/me', UsersController.getMe);
  api.get('/files/:id', FilesController.getShow);
  api.get('/files', FilesController.getIndex);
  api.get('/files/:id/data', FilesController.getFile);

  api.put('/files/:id/publish', FilesController.putPublish);
  api.put('/files/:id/publish', FilesController.putUnpublish);

  api.post('/users', UsersController.postNew);
  api.post('/files', FilesController.postUpload);
};

export default addRoutes;
