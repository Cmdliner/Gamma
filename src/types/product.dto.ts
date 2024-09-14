import IElectronics from "./electronics.schema";

export type TElectronicsUploadBody = Omit<IElectronics, "ownership_documents_url" | "product_images_url">;