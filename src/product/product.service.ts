import Product from "./product.model"

type ProductCoords = [number, number];

class ProductService {

    static async filterAndSortByLocation(
        coordinates: ProductCoords,
        category: string,
        limit: number,
        skips: number
    ) {
        //! todo => Populate owner field of product
        const products = await Product.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates,
                    },
                    distanceField: "distance",
                    spherical: true,
                },
            },
            { $match: { category } },
            { $sort: { distance: 1 } },
            // Begin new
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            { $unwind: "$owner" },
            // End new
            { $limit: limit },
            { $skip: skips }
        ]);

        return products;
    }
}

export default ProductService;