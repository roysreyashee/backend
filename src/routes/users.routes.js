import {Router} from 'router';
import registerUser, { loginUser, logoutUser, refreshAccessToken } from '../controllers/user.controller';
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
export default router;