import { model, Schema } from "mongoose";

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        reauired: true,
    },
    firstname: {
        type: String,
    },
    lastname: {
        type: String,
    },
    age: {
        type: Number,
    },
    bvn: {
        type: String
    },
    nin: {
        type: String
    },
    gender: {
        type: String
    },
    addresses: [{
        type: Schema.Types.ObjectId,
        ref: "Address"
    }],
    contact_info: [{
        type: Schema.Types.ObjectId,
        ref: "MobileNumber"
    }],
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const User = model("user", UserSchema);

export default User;