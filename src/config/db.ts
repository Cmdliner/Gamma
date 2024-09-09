import mongoose from "mongoose";

class DB {
    static async connect() {
        return mongoose.connect(process.env.MONGO_URI as string);
    }
}

export default DB;