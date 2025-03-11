import { Schema, model } from "mongoose";

const BusinessSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    business_id: {
        type: String,
        required: true,
        unique: true
    }
});

const Business = model("Business", BusinessSchema);

export default Business;