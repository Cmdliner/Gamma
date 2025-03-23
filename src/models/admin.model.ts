import { model, Schema } from "mongoose";

const AdminSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        requred: true
    },
    role: {
        type: String,
        enum: ["super_admin", "regular_admin"],
        default: "regular_admin"
    },
}, {timestamps: true});

const Admin = model("Admin", AdminSchema);

export default Admin;