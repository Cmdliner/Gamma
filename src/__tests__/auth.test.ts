// import app from "../app";
// import request from "supertest";
// import mongoose from "mongoose";
// import DB from "../config/db";
// import User from "../user/user.model";

// beforeAll(async () => await DB.connect());

// afterAll(async () => {
//     await User.deleteMany();
//     await DB.disconnect();
// });



// describe("User onboarding and authentication logic", () => {
//     it("should fail with future date of birth", async () => {
//         const res = await request(app)
//             .post("/api/v1/auth/register")
//             .send({
//                 first_name: "",
//                 last_name: "",
//                 email: "",
//                 age: 0,
//                 gender: "M",
//                 state_of_origin: "",
//                 phone_numbers: []
//             });

//             expect(res.status).toBe(422)
//     })
// });