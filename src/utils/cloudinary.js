import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });



const uploadOnCloudinary = async (localFilePath) => {

        try{
            if(!localFilePath){
                throw new Error("File path is required");
            }
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto",
            })

            //file uploaded successfully in cloudinary
            console.log("File uploaded successfully in cloudinary", response.url);
            return response;
        }catch(error){
            fs.unlinkSync(localFilePath); // remove the locally saved temporary file if the upload operation fails
        }
}

export default uploadOnCloudinary;

