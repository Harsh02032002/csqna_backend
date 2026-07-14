import Auth from './auth.js';
import Admin from './admin.js';
import { Verify, VerifyRole } from "../middleware/verify.js";
import User from './user.js';
import Chat from './chat.js';
import Content from './content.js';

const Router = (app) => {
  // home route with the get method and a handler
  app.get("/v1", (req, res) => {
    try {
      res.status(200).json({
        status: true,
        code: 200,
        data: [],
        message: "Welcome to Prashnavali API homepage!",
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        code: 500,
        message: "Internal Server Error",
      });
    }
  })

  app.use('/v1/auth', Auth);

  app.get("/v1/user", Verify, (req, res) => {
    res.status(200).json({
      status: true,
        code: 200,
      message: "Welcome to the your Dashboard!",
    });
  });

  app.get("/v1/admin", Verify, VerifyRole, (req, res) => {
    res.status(200).json({
      status: true,
        code: 200,
      message: "Welcome to the Admin portal!",
    });
  });

  app.use("/v1/admin", Verify, VerifyRole, Admin);
  app.use("/v1/user", Verify, User);
  app.use("/v1/chat", Chat);
  app.use("/v1/content", Content);

};



export default Router;