import App from "./app";
import DB from "./config/db.config";

const app = new App();

DB.connect().then( () => app.start().catch(err => console.error(err)));