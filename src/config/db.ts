import mongoose from "mongoose";

class DB {
    static async connect() {
        return mongoose.connect(process.env.MONGO_URI);
    } 
    static async disconnect() {
        return mongoose.connection.close();
    }
}

export default DB;