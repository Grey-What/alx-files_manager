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

  api.post('/users', UsersController.postNew);
  api.post('/file', FilesController.postUpload);
};

export default addRoutes;
