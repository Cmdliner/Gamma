import IProduct from "./product.schema";

interface ILandedProperty extends IProduct {
    localty: string;
    dimensions: string;
    condition: "fairly_used" | "newly_built" | "old" | "renovated" | "under_construction" | "empty_land";
}

export default ILandedProperty;