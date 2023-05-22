const bodyParser = require('body-parser');
const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv').config();
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

const { notFound, errorHandler } = require('./middlewares/errorHandler');
const dbConnect = require('./config/dbConnect');
const authRouter = require('./routes/authRoute');
const productRouter = require('./routes/productRoute');
const blogRouter = require('./routes/blogRoute');
const prodCategoryRouter = require('./routes/prodCategoryRoute');
const blogCategoryRouter = require('./routes/blogCateRoute');
const brandRouter = require('./routes/brandRoute');
const couponRouter = require('./routes/couponRoute');

dbConnect();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/user', authRouter);
app.use('/api/product', productRouter);
app.use('/api/blog', blogRouter);
app.use('/api/category', prodCategoryRouter);
app.use('/api/blogCategory', blogCategoryRouter);
app.use('/api/brand', brandRouter);
app.use('/api/coupon', couponRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server is running at PORT ${PORT}`);
});
