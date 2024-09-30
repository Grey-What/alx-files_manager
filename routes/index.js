import AppController from "../controllers/AppController";

const addRoutes = (api) => {
  api.get("/status", AppController.getStatus);
  api.get("/stats", AppController.getStats);
};

export default addRoutes;
