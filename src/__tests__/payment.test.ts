// import request from 'supertest';
// import App, { API_VERSION } from '../app';
// import DB from '../config/db.config';

// // ! cannot sponsor sold products
// // ! cannot responsor unexpired sponsorship
// // ! cannot have 2 users buying the same product
// // ! cannot send empty, whitespace content
// // ! cannot buy deleted products
// // ! cannot perform crud operations on deleted product

// const app = new App().expose();
// beforeAll(async () => {
//     await DB.connect();
//     app.listen(3500, () => console.log("Mock server is up and running"));
// });




// describe('Payment Controller', () => {

//     it('should not allow sponsoring sold products', async () => {
//         const soldProductId = '12345';

//         const response = await request(app)
//             .post(`/${API_VERSION}/payments/${soldProductId}/sponsor`)
//             .send({ payment_method: 'bank_transfer', sponsorship_duration: '1Month' });

//         expect(response.status).toBe(400); // Assuming 400 Bad Request for this scenario
//         expect(response.body.message).toBe('Product sold!');
//     });

//     it('should not allow buying of deleted products', async () => {
//         const deletedProductId = '12324';

//         const response = await request(app)
//             .post(`/${API_VERSION}/payments/${deletedProductId}/purchase`)
//             .send({ payment_method: 'bank_transfer' })


//         expect(response.status).toBe(404)
//         expect(response.body).toBe('Product not found!')
//     });

//     it('should not allow bidding of already sold products', async () => {
//         const deletedProductId = '12345';

//         const response = await request(app)
//             .post(`${API_VERSION}/payments/bids/${deletedProductId}/new`)
//             .send({ negotiating_price: 2000 })


//         expect(response.status).toBe(404)
//     })

// });

