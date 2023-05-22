const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const asyncHandler = require('express-async-handler');
const { generateToken } = require('../config/jwtToken');
const { validateMongoDbId } = require('../utils/validationMongodbId');
const { generateRefreshToken } = require('../config/refreshToken');
const jwt = require('jsonwebtoken');
const sendEmail = require('./emailController');
const crypto = require('crypto');
const uniqid = require('uniqid');

const createUser = asyncHandler(async (req, res) => {
	const email = req.body.email;
	const findUser = await User.findOne({ email: email });
	if (!findUser) {
		const newUser = await User.create(req.body);
		res.json(newUser);
	} else {
		throw new Error('User already exist');
	}
});

const loginUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const findUser = await User.findOne({ email });
	if (findUser && (await findUser.isPasswordMatched(password))) {
		const refreshToken = await generateRefreshToken(findUser?._id);
		const updateUser = await User.findByIdAndUpdate(
			findUser.id,
			{ refreshToken: refreshToken },
			{ new: true }
		);
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			maxAge: 72 * 60 * 60 * 1000,
		});
		res.json({
			id: findUser?._id,
			firstname: findUser?.firstname,
			lastname: findUser?.lastname,
			email: findUser?.email,
			mobile: findUser?.mobile,
			token: generateToken(findUser?.id),
		});
	} else {
		throw new Error('Invalid Credentitals');
	}
});

const loginAdmin = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const findAdmin = await User.findOne({ email });
	if (findAdmin.role !== 'admin') throw new Error('Not Authorised');
	if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
		const refreshToken = await generateRefreshToken(findAdmin?._id);
		const updateUser = await User.findByIdAndUpdate(
			findAdmin.id,
			{ refreshToken: refreshToken },
			{ new: true }
		);
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			maxAge: 72 * 60 * 60 * 1000,
		});
		res.json({
			id: findAdmin?._id,
			firstname: findAdmin?.firstname,
			lastname: findAdmin?.lastname,
			email: findAdmin?.email,
			mobile: findAdmin?.mobile,
			token: generateToken(findAdmin?.id),
		});
	} else {
		throw new Error('Invalid Credentitals');
	}
});

const saveAddress = asyncHandler(async (req, res, next) => {
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		const updatedUser = await User.findByIdAndUpdate(
			_id,
			{ address: req?.body?.address },
			{ new: true }
		);
		res.json(updatedUser);
	} catch (error) {
		throw new Error(error);
	}
});

const getAllUser = asyncHandler(async (req, res) => {
	try {
		const getAllUsers = await User.find();
		res.json(getAllUsers);
	} catch (error) {
		throw new Error(error);
	}
});

const getUser = asyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const getUser = await User.findById(id);
		res.json(getUser);
	} catch (error) {
		throw new Error(error);
	}
});

const handleRefreshToken = asyncHandler(async (req, res) => {
	const cookie = req.cookies;
	if (!cookie?.refreshToken) throw new Error('No Refresh Token In Cookies');
	const refreshToken = cookie.refreshToken;
	const user = await User.findOne({ refreshToken });
	if (!user) throw new Error('No refresh token present in db or not matched');
	jwt.verify(refreshToken, process.env.JWT_SECRET, (error, decoded) => {
		if (error || user.id !== decoded.id) {
			throw new Error('There is something wrong with refresh token');
		}
		const accessToken = generateToken(user?._id);
		res.json({ accessToken });
	});
});

const logout = asyncHandler(async (req, res) => {
	const cookie = req.cookies;
	if (!cookie.refreshToken) throw new Error('No Refresh Token In Cookie');
	const refreshToken = cookie.refreshToken;
	const user = await User.findOne({ refreshToken });
	if (!user) {
		res.clearCookie('refreshToken', {
			httpOnly: true,
			secure: true,
		});
		return res.sendStatus(204);
	}
	console.log(refreshToken);
	const updated = await User.findOneAndUpdate(
		{ refreshToken: refreshToken },
		{
			refreshToken: '',
		},
		{ new: true }
	);
	console.log(updated);

	res.clearCookie('refreshToken', {
		httpOnly: true,
		secure: true,
	});
	return res.sendStatus(204);
});

const updatedUser = asyncHandler(async (req, res) => {
	const { id } = req.user;
	validateMongoDbId(id);
	try {
		const updateUser = await User.findByIdAndUpdate(
			id,
			{
				firstname: req?.body?.firstname,
				lastname: req?.body?.lastname,
				email: req?.body?.email,
				mobile: req?.body?.mobile,
				role: req?.body?.role,
			},
			{
				new: true,
			}
		);
		res.json(updateUser);
	} catch (error) {
		throw new Error(error);
	}
});

const deleteUser = asyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const deleteUser = await User.findByIdAndDelete(id);
		res.json(deleteUser);
	} catch (error) {
		throw new Error(error);
	}
});

const blockUser = asyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const block = await User.findByIdAndUpdate(
			id,
			{ isBlocked: true },
			{ new: true }
		);
		res.json({ message: 'User Blocked' });
	} catch (error) {
		throw new Error(error);
	}
});

const unblockUser = asyncHandler(async (req, res) => {
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const unblock = await User.findByIdAndUpdate(
			id,
			{ isBlocked: false },
			{ new: true }
		);
		res.json({ message: 'User UnBlocked' });
	} catch (error) {
		throw new Error(error);
	}
});

const updatePassword = asyncHandler(async (req, res) => {
	const { _id } = req.user;
	const { password } = req.body;
	validateMongoDbId(_id);
	const user = await User.findById(_id);
	if (password) {
		user.password = password;
		const updatedPassword = await user.save();
		res.json(updatedPassword);
	} else {
		res.json(user);
	}
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
	const { email } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		throw new Error('User not found with this email');
	}
	try {
		const token = await user.createPasswordResetToken();
		await user.save();
		const resetURL = `Hi, please fllow this link to rest your Password. This link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</a>`;
		const data = {
			to: email,
			subject: 'Forgot Password Link',
			text: 'Hey User',
			htm: resetURL,
		};
		sendEmail(data);
		res.json(token);
	} catch (error) {
		throw new Error(error);
	}
});

const resetPassword = asyncHandler(async (req, res) => {
	const { password } = req.body;
	const { token } = req.params;
	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() },
	});
	if (!user) throw new Error('Token expired, please try again later');
	user.password = password;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();
	res.json(user);
});

const getWishlist = asyncHandler(async (req, res) => {
	const { _id } = req.user;
	try {
		const findUser = await User.findById(_id).populate('wishlist');
		res.json(findUser);
	} catch (error) {
		throw new Error(error);
	}
});

const userCart = asyncHandler(async (req, res) => {
	const { cart } = req.body;
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		let products = [];
		const user = await User.findById(_id);
		const alreadyExistCart = await Cart.findOne({ orderby: user._id });
		if (alreadyExistCart) {
			alreadyExistCart.remove();
		}
		for (let i = 0; i < cart.length; i++) {
			let object = {};
			object.product = cart[i]._id;
			object.count = cart[i].count;
			object.color = cart[i].color;
			let getPrice = await Product.findById(cart[i]._id).select('price').exec();
			object.price = getPrice.price;
			products.push(object);
		}
		let cartTotal = 0;
		for (let i = 0; i < products.length; i++) {
			cartTotal = cartTotal + products[i].price * products[i].count;
		}
		let newCart = await new Cart({
			products,
			cartTotal,
			orderby: user?._id,
		}).save();
		res.json(newCart);
	} catch (error) {
		throw new Error(error);
	}
});

const getUserCart = asyncHandler(async (req, res) => {
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		const cart = await Cart.findOne({ orderby: _id }).populate(
			'products.product',
			'_id title price totalAfterDiscount'
		);
		res.json(cart);
	} catch (error) {
		throw new Error(error);
	}
});

const emptyCart = asyncHandler(async (req, res) => {
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		const user = await User.findOne({ _id });
		const cart = await Cart.findOneAndRemove({ orderby: user._id });
		res.json(cart);
	} catch (error) {
		throw new Error(error);
	}
});

const applyCoupon = asyncHandler(async (req, res) => {
	const { coupon } = req.body;
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		const validCoupon = await Coupon.findOne({ name: coupon });
		if (validCoupon === null) {
			throw new Error('Invalid Coupon');
		}
		const user = await User.findOne({ _id });
		let { cartTotal } = await Cart.findOne({
			orderby: user._id,
		});
		let totalAfterDiscount = (
			cartTotal -
			(cartTotal * validCoupon.discount) / 100
		).toFixed(2);
		await Cart.findOneAndUpdate(
			{ orderby: user._id },
			{ totalAfterDiscount },
			{ new: true }
		);
		res.json(totalAfterDiscount);
	} catch (error) {
		throw new Error(error);
	}
});

const createOrder = asyncHandler(async (req, res) => {
	const { COD, couponApplied } = req.body;
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		if (!COD) throw new Error('Create cash order failed');
		const user = await User.findById(_id);
		let userCart = await Cart.findOne({ orderby: user._id });
		let finalAmount = 0;
		if (couponApplied && userCart.totalAlterDiscount) {
			finalAmount = userCart.totalAlterDiscount;
		} else {
			finalAmount = userCart.cartTotal;
		}
		let newOrder = await new Order({
			products: userCart.products,
			paymentIntent: {
				id: uniqid(),
				method: 'COD',
				amount: finalAmount,
				status: 'Cash on Delivery',
				created: Date.now(),
				currency: 'usd',
			},
			orderby: user._id,
			orderStatus: 'Cash on Delivery',
		}).save();
		let update = userCart.product.map((item) => {
			return {
				updateOne: {
					filter: { _id: item.product._id },
					update: { $inc: { quantity: -item.count, sold: +item.count } },
				},
			};
		});
		const updated = await Product.bulkSave(update, {});
		res.json({ message: 'Success' });
	} catch (error) {
		throw new Error(error);
	}
});

const getOrders = asyncHandler(async (req, res) => {
	const { _id } = req.user;
	validateMongoDbId(_id);
	try {
		const userOrders = await Order.findOne({ orderby: _id })
			.populate('products.product')
			.exec();
		res.json(userOrders);
	} catch (error) {
		throw new Error(error);
	}
});

const updateOrderStatus = asyncHandler(async (req, res) => {
	const { status } = req.body;
	const { id } = req.params;
	validateMongoDbId(id);
	try {
		const updateOrderStatus = await Order.findByIdAndUpdate(
			id,
			{
				orderStatus: status,
				paymentIntent: {
					status: status,
				},
			},
			{ new: true }
		);
		res.json(updateOrderStatus);
	} catch (error) {
		throw new Error(error);
	}
});

module.exports = {
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
};
