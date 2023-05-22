const mongoose = require('mongoose');

const mongoose = require('mongoose');

var productSchema = new mongoose.Schema(
	{
		title: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, lowercase: true },
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		category: {
			// type: mongoose.Schema.Types.ObjectId,
			// ref: 'Category',
			type: String,
			required: true,
		},
		brand: {
			type: String,
			// enum: ['Apple', 'Samsung', 'Lenovo'],
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
		},
		sold: {
			type: Number,
			default: 0,
		},
		images: [],
		color: {
			type: String,
			// enum: ['Black', 'Brown', 'Red'],
			required: true,
		},
		ratings: [
			{
				star: Number,
				comment: String,
				postedby: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			},
		],
		totalRating: {
			type: String,
			default: 0,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
