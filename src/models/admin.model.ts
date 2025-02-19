import { model, Schema } from "mongoose";

const AdminSchema = new Schema({
    role: {
        type: String,
        enum: ["super_admin", "regular_admin"]
    },
}, {timestamps: true});

const Admin = model("Admin", AdminSchema);

export default Admin;