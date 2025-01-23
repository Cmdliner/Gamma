import mongoose from "mongoose";
import { cfg } from "../init";

class DB {
    
    static async connect() {
        return mongoose.connect(cfg.DB_URI);
    } 

    static async disconnect() {
        return mongoose.connection.close();
    }
}

export default DB;