import {Router} from 'router';
import registerUser, { getCurrentUser, getWatchHistory, loginUser, logoutUser, refreshAccessToken, updateAccountDetails, updateUserAvatar, updateUserCoverImage,getUserChannelProfile } from '../controllers/user.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxcount: 1,
        },
        {
            name: "coverImage",
            maxcount: 1,
        }
    ])
    ,registerUser)


   
router.route("/login").post(loginUser)

 //secured routes 
 router.route("/logout").post(verifyJWT, logoutUser)

 router.route("/refresh-token").post(refreshAccessToken)

 //secured routes
 // GET /current-user - Requires JWT verification, retrieves current user details
 router.route("/current-user").get(verifyJWT, getCurrentUser)
 
 // PATCH /update-account - Requires JWT verification, updates user account details
 router.route("/update-account").patch(verifyJWT, updateAccountDetails)
 
 // PATCH /avatar - Requires JWT verification, accepts single "avatar" file upload, updates user avatar
 router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
 
 // PATCH /cover-image - Requires JWT verification, accepts single "coverImage" file upload, updates user cover image
 router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
 
 // GET /c/:username - Requires JWT verification, :username parameter to get user channel profile
 router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
 
 // GET /watch-history - Requires JWT verification, retrieves user watch history
 router.route("/watch-history").get(verifyJWT, getWatchHistory)

 
export default router;