import Product from "./product.model"

type ProductCoords = [number, number];

class ProductService {

    static async filterAndSortByLocation(
        [longitude, latitude]: ProductCoords,
        category: string,
        limit: number,
        skips: number
    ) {
        const products = await Product.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [longitude, latitude],
                    },
                    distanceField: "distance",
                    spherical: true,
                },
            },
            { $match: { category } },
            { $sort: { distance: 1 } },
            { $limit: limit },
            { $skip: skips }
        ]);

        return products;
    }
}

export default ProductService;