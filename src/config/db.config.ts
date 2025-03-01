import mongoose from "mongoose";
import { cfg } from "../init";

class DB {

    private static connection = null;
    static async connect() {
        try {
            if (!this.connection) {
                this.connection = await mongoose.connect(cfg.DB_URI, {maxPoolSize: 10});
            }
            return this.connection;
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
        
    }

    static async disconnect() {
        return mongoose.connection.close();
    }
}

export default DB;