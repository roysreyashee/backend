// Import the user model for database operations
import { User } from '../models/users.model.js';
// Import async handler wrapper to catch errors in async route handlers
import {asyncHandler} from '../utils/asyncHandler.js';
// Import custom error type for consistent error handling
import {ApiError} from "../utils/ApiError.js"
// Duplicate import of User model from a different file path
import { User} from "../models/user.model.js"
// Import helper for uploading media to Cloudinary
import {uploadOnCloudinary} from "../utils/cloudinary.js"
// Import standard API response wrapper
import { ApiResponse } from "../utils/ApiResponse.js";
// Import JWT library for token verification
import jwt from "jsonwebtoken"
// Import mongoose (currently unused in this file)
import mongoose from "mongoose";

// Utility function to generate access and refresh tokens for a user
const generateAccessAndRefreshTokens = async(userId)=> {

    try{

      const user = await  User.findById({
            userId
      })
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      // Save the generated refresh token in the user document
      user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false})

      return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }
}

// Register a new user with uploaded avatar and optional cover image
const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    // Validate required fields
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // Check if a user with the same username or email already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    // Extract uploaded avatar path
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // Upload avatar and cover image to cloud storage
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   
    // Create user record in the database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    // Return created user without sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

// Authenticate user and return tokens along with user data
const loginUser = asyncHanlder(async(req,res) => {

    //req body -> data
    //username or email based login 
    //find the user whether exist
    //if user found password check
    //access and refresh token
    //send secure cookie

    //extract data from req body
    const {email, username, password} = req.body
    if(!username && !email){
        throw new ApiError(400, "Username or password is required!")
    }

    // Find user by email or username
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    
    if(!user){
        throw new ApiError(404, "User doesn't exist")
    }

    // Verify password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid Credentials")
    }

   const {accessToken, refreshToken} = await  generateAccessAndRefreshTokens(user._id)

  const loggedInUser =  await User.findById(user._id).select("-password -refreshToken")

  //pass the cookie 
  const options = {
    httpOnly : true,
    secure: true,
  }

  return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(

                new ApiResponse(
                    200,
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User logged in successfully"
                )

            )
})

// Log out current user and clear stored refresh token
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

// Refresh access token using a valid refresh token
const refreshAccessToken = asyncHandler(async(req,res) => {

    //The refreshtoken which is being sent by the user in the request the refreshtoken which was there in cookies or request body
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshAccessToken

        //If the incomingRedfreshToken is not there in the APi request
        if(!incomingRefreshToken){
                throw new ApiError(401, "Unauthorized Access")
        }

        try{

            //If the incomingRefreshToken is present then decode the incoming refreshtoken
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET // it passes the refreshtokensecret from env so that server validate the incomingRefreshToken
        )

        //Check whether the decoded refresh token is present in the database
        const user = await User.findById(
            decodedToken._id
        )

        if(!user){
            throw new ApiError("Invalid refresh token. User is not valid")
        }

        if(incomingRefreshToken || user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, newrefreshToken} =  await generateAccessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access token refreshed successfully"
            )
        )

        }catch(err){
            throw new ApiError(401, error?.message || "Invalid Refresh Token")
        }
        
})


// Change the current authenticated user's password
const changeCurrentPassword = asyncHandler(async(req,res) => {

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Password Changed Successfully"
                )
            )

})

/**
 * Get current authenticated user
 * Handler: getCurrentUser
 * - Expects req.user to be populated by authentication middleware
 * - Returns HTTP 200 with the current user object and a success message
 * Note: Uses asyncHandler to catch and forward errors to the error middleware.
 */
const getCurrentUser = asyncHandler(async(req,res) => {
    // Respond with the authenticated user object
    return res.status(200).json(200, req.user , "Current user fetched successfully")
})

/**
 * Update account details for the current user
 * Handler: updateAccountDetails
 * - Expects fullName and email in req.body
 * - Validates presence of required fields and throws ApiError(400) if missing
 * - Updates the user document anad returns the updated user (password excluded)
 * - Returns HTTP 200 with a success ApiResponse
 */
const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body 

    // Validate input
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    // Update user record and exclude password field from result
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email,
            },
        } ,
        {new: true}
    ).select("-password")

    // Return standardized ApiResponse with success message
    return res.status(200).json(
        200, new ApiResponse("Account Details Updated Successfully") 
    )

})

/**
 * Update user avatar image
 * Receives avatar file, uploads to Cloudinary, and updates user profile
 */
const updateUserAvatar = asyncHandler(async(req, res) => {
    // Extract avatar file path from request
    const avatarLocalPath = req.file?.path

    // Validate that avatar file was provided
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    // Upload avatar to Cloudinary cloud storage
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    // Validate successful upload and URL retrieval
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    // Update user document with new avatar URL and fetch updated user without password
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    // Return success response with updated user data
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})


/**
 * Update user cover image
 * Receives cover image file, uploads to Cloudinary, and updates user profile
 */
const updateUserCoverImage = asyncHandler(async(req, res) => {
    // Extract cover image file path from request
    const coverImageLocalPath = req.file?.path

    // Validate that cover image file was provided
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment

    // Upload cover image to Cloudinary cloud storage
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // Validate successful upload and URL retrieval
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    // Update user document with new cover image URL and fetch updated user without password
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    // Return success response with updated user data
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

// Fetch user channel profile with subscription details
// This aggregation pipeline retrieves detailed channel information including subscriber counts and subscription status
const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params

    // Validate that username parameter is provided and not empty
    if(!username?.trim()){
        throw new ApiError(400 , "Username is missing")
    }

    // Build aggregation pipeline to fetch channel profile data
    const channel = await User.aggregate([
        
        // Stage 1: $match - Filter user by username (case-insensitive)
        // Retrieves the specific channel/user document matching the requested username
        {
            $match: {
                username: username?.toLowerCase()
            },
        },
        
        // Stage 2: $lookup (First) - Join subscriptions collection to get subscribers
        // Finds all subscriptions where this user's ID is the channel 
        // Results stored in "subscribers" array containing all users subscribed to this channel
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        
        // Stage 3: $lookup (Second) - Join subscriptions collection to get channels subscribed to
        // Finds all subscriptions where this user's ID is the subscriber
        // Results stored in "subscribedTo" array containing all channels this user subscribes to
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscribers",
                as: "subscribedTo"
            },
        },
        
        // Stage 4: $addFields - Compute derived fields from the joined data
        // Adds three new fields to the output:
        // - subscribersCount: Total number of users subscribed to this channel
        // - channelsSubscribersToCount: Total number of channels this user subscribes to
        // - isSubscribed: Boolean flag indicating if the current request user is subscribed to this channel
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribersToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false,
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                sunscribersCount: 1,
                channelsSubscribersToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    
    ])

    if(!channel.length){
        throw new ApiError(404 , "Channel doesn't exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res) => {
    // Match the current user by their ID
    const user = await User.aggregate([
        {
        $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
        }
    },
    // Join with videos collection using the watchHistory field
    {
        $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                {
                    // Join with users collection to get owner details
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                            // Project only required owner fields
                            $project: {
                                fullName: 1,
                                username: 1,
                                avatar: 1,
                            }
                            }
                            
                        ]
                    },
                    // Convert owner array to single object
                    $addFields: {
                        owner: {
                            $first: "$owner"
                        }
                    }
                }
            ]
        }
    }
    ])

    // Return the watch history with success response
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})



export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getWatchHistory};