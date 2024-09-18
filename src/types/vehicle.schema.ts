import IProduct from "./product.schema";

interface IVehicle extends IProduct {
    make: string;
    is_registered: boolean;
    item_model: string;
    year: number;
    condition:  "new" | "used";
    vin: string;
    transmission_type: string;
}

export default IVehicle;