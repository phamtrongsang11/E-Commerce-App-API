const express = require('express');
const {
	createProduct,
	getProduct,
	getAllProduct,
	updateProduct,
	deleteProduct,
	filterProduct,
	addToWishlist,
	rating,
	uploadImages,
} = require('../controller/productController');
const { isAdmin, authMiddleware } = require('../middlewares/authMiddleware');
const {
	uploadPhoto,
	productImgResize,
} = require('../middlewares/uploadImages');
const router = express.Router();

router.post('/create', authMiddleware, isAdmin, createProduct);
router.put(
	'/upload/:id',
	authMiddleware,
	isAdmin,
	uploadPhoto.array('images', 10),
	productImgResize,
	uploadImages
);
router.get('/filter', filterProduct);
router.put('/wishlist', authMiddleware, addToWishlist);
router.put('/rating', authMiddleware, rating);
router.get('/:id', getProduct);
router.get('/', getAllProduct);
router.put('/:id', authMiddleware, isAdmin, updateProduct);
router.delete('/:id', authMiddleware, isAdmin, deleteProduct);

module.exports = router;
