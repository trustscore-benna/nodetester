const express = require('express');
const dotenv = require('dotenv');
const app = express()
const mongoose = require('mongoose');
dotenv.config({ override: true });

const UserRouter = require('./routes/user.routes');
app.use(express.json());
app.use("/api/users", UserRouter);

const PORT = process.env.PORT;

mongoose.connect(process.env.DB_URI || process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');

        app.listen(PORT, () => {
            console.log(`server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log(`MongoDB connection failed: ${error.message}`);
    });



    module.exports=async(req,res)=>{
        await connectDB

    return app(req,res);
    }
