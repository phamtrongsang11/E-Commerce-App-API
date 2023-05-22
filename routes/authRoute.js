const express = require('express');
const {
	createUser,
	loginUser,
	getAllUser,
	getUser,
	updatedUser,
	deleteUser,
	blockUser,
	unblockUser,
	handleRefreshToken,
	logout,
	updatePassword,
	forgotPasswordToken,
	resetPassword,
	loginAdmin,
	getWishlist,
	saveAddress,
	userCart,
	getUserCart,
	emptyCart,
	applyCoupon,
	createOrder,
	getOrders,
	updateOrderStatus,
} = require('../controller/userController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', createUser);
router.post('/forgot-password-token', forgotPasswordToken);
router.put('/save-address', authMiddleware, saveAddress);
router.put('/reset-password/:token', resetPassword);
router.put('/password', authMiddleware, updatePassword);
router.post('/login', loginUser);
router.post('/admin-login', loginAdmin);
router.post('/cart/applycoupon', authMiddleware, applyCoupon);
router.post('/cart', authMiddleware, userCart);
router.get('/cart', authMiddleware, getUserCart);
router.get('/get-orders', authMiddleware, getOrders);
router.delete('/empty-cart', authMiddleware, emptyCart);
router.post('/cart/cash-order', authMiddleware, createOrder);
router.put(
	'/order/update-order/:id',
	authMiddleware,
	isAdmin,
	updateOrderStatus
);

router.get('/all-user', getAllUser);
router.get('/refresh', handleRefreshToken);
router.get('/logout', logout);
router.get('/wishlist', authMiddleware, getWishlist);
router.get('/:id', authMiddleware, isAdmin, getUser);

router.put('/edit-user', authMiddleware, updatedUser);
router.delete('/:id', authMiddleware, deleteUser);
router.put('/block-user/:id', authMiddleware, isAdmin, blockUser);
router.put('/unblock-user/:id', authMiddleware, isAdmin, unblockUser);

module.exports = router;
