const bcryptjs = require("bcryptjs");
const UserModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const AccountModel = require("../models/account.model");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET

})


let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.APP_EMAIL,
    pass: 'yourpassword'
  }
});

const registerUser = async (req, res) => {
  const { firstname, lastname, email, password, tag, photo } = req.body;
  try {

    const saltround = await bcryptjs.genSalt(10);

    const hashPass = await bcryptjs.hash(password, saltround);

      const number = `${Math.ceil(Math.random()*10000000)}`.padStart(7, "0")
     const generatedAccount=`AUG${number}`

    // const userAccount= await AccountModel.create({
    //   accountNumber:`AUG${number}`
    // })

    const image = await cloudinary.uploader.upload(photo, {
      
    })
    const user = await UserModel.create({
      firstname,
      lastname,
      email,
      tag,
      profilepicture: {
        secure_url: image.secure_url,
        public_id: image.public_id
      },
      password: hashPass,
      accountNumber:generatedAccount,

    });

    let mailOptions = {
  from: 'process.env.APP_EMAIL',
  to: 'myfriend@yahoo.com',
  subject: `Welcome to our app! ${firstname}`,
  text: `welcome to my app, your account number is ${user.accountNumber}`
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
    

    const token = await jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" },
    );

    res.status(201).send({
      message: "User created successfully",
      data: {
        firstname,
        lastname,
        email,
        role: user.role,
        tag: tag ? tag : null,
        accountNumber:generatedAccount,
        token,
        balance:user.balance,
        photo:user.profilepicture.secure_url
      },
    });
  } catch (error) {
    console.log(error);
    
    if (error.code == 11000) {
      res.status(400).send({
        message: "Email or tag already exist",
      });
    } else {
      res.status(400).send({
        message: "user cannot be created at this time",
      });
    }
  }
};

const registerOperator = async (req, res) => {
  const { firstname, lastname, email, password, tag } = req.body;
  try {
    const saltround = await bcryptjs.genSalt(10);

    const hashPass = await bcryptjs.hash(password, saltround);

    const user = await UserModel.create({
      firstname,
      lastname,
      email,
      tag,
      role: "operator",
      password: hashPass,
    });

    const token = await jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "10m", algorithm: "HS256" },
    );

    res.status(201).send({
      message: "Operator created successfully",
      data: {
        firstname,
        lastname,
        email,
        role: user.role,
        tag: tag ? tag : null,
        token,
      },
    });
  } catch (error) {
    if (error.code == 11000) {
      res.status(400).send({
        message: "Email or tag already exist",
      });
    } else {
      res.status(400).send({
        message: "Operator cannot be created at this time",
      });
    }
  }
};

const getUser = async (req, res) => {
  const { id } = req.user;

  try {
    const user = await UserModel.findById(id);

    if (!user) {
      res.status(400).send({
        message: "User not found",
      });

      return;
    }

    res.status(200).send({
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);

    res.status(400).send({
      message: "User cannot be fetched at this time",
    });
  }
};

const getUserByOperator = async (req, res) => {
  const { id, role } = req.user;
  console.log(role);

  const { userId } = req.params;
  try {
    if (role != "operator" && role != "admin") {
      //(role=="user"){
      console.log(role);

      res.status(403).send({
        message: "Forbidden resource",
      });

      return;
    }
    const user = await UserModel.findById(userId).populate("accountNumber");

    if (!user) {
      res.status(400).send({
        message: "User not found",
      });

      return;
    }

    res.status(200).send({
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);

    res.status(400).send({
      message: "User cannot be fetched at this time",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isUser = await UserModel.findOne({ email }).select("+password");

    if (!isUser) {
      res.status(400).send({
        message: "Account does not exist",
      });

      return;
    }

    const isMatch = await bcryptjs.compare(password, isUser.password);

    if (!isMatch) {
      res.status(400).send({
        message: "Invalid credentials",
      });

      return;
    }

    const token = await jwt.sign(
      { id: isUser._id, role: isUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" },
    );

    res.status(200).send({
      message: "user login successful",

      data: {
        firstname: isUser.firstname,
        lastname: isUser.lastname,
        email: isUser.email,
        role: isUser.role,
        token,
        tag: isUser.tag?isUser.tag:null,
        balance:isUser.balance
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Invalid credentials",
    });
  }
};

const loginOperator = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isOperator = await UserModel.findOne({ email }).select("+password");

    if (!isOperator) {
      res.status(400).send({
        message: "Account does not exist",
      });

      return;
    }

    const isMatch = await bcrypt.compare(password, isOperator.password);

    if (!isMatch) {
      res.status(400).send({
        message: "Invalid credentials",
      });

      return;
    }

    const token = await jwt.sign(
      { id: isOperator._id, role: isOperator.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" },
    );

    res.status(200).send({
      message: "user login successful",

      data: {
        firstname: isOperator.firstname,
        lastname: isOperator.lastname,
        email: isOperator.email,
        role: isOperator.role,
        token,
        tag: tag?tag:null
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Invalid credentials",
    });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const {role}= req.user
  const {firstname, lastname}=req.body
  try {
     if(role!=="operator"&&role!=="admin"){
      return res.status(403).send({
        message:"Forbidden Resource"
      })
     }

     const allowedUpdate = {
      ...(firstname&&{firstname:firstname.trim()}),
      ...(lastname&&{lastname:lastname.trim()})
     }

     const updatedUser = await UserModel.findByIdAndUpdate(id,allowedUpdate, {returnDocument:"after", runValidators:true} )

     if(!updatedUser){
      return res.status(400).send({
        message:"cannot update user at this time"
      })
     }

     res.status(200).send(
      {
        message:"user updated successfully",
        data:updatedUser
      }
     )
  } catch (error) {
    console.log(error);
    
    res.status(500).send(
      {
        message:"Cannot update User",
      })
  }
};


const resolveAccount=async(req, res)=>{
  const {accountNumber}=req.params
  try {
    const user= await UserModel.findOne({accountNumber})

    if(!user){
      return res.status(404).send({
        message:"cannot resolve account number"
      })
    }

    res.status(200).send({
      message:"account retrieved",
      data:{
        accountname:user.firstname+" "+user.lastname,
        tag:user.tag?user.tag:null,
        id:user._id

      }
    })
  } catch (error) {
    console.log(error);
    
     return res.status(500).send({
        message:"cannot resolve account number"
      })
  }
}

const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1]
      ? req.headers["authorization"].split(" ")[1]
      : req.headers["authorization"].split(" ")[0];

    const user = jwt.verify(
      token,
      process.env.JWT_SECRET,
      function (err, decoded) {
        if (err) {
          console.log(err);

          res.status(401).send({
            message: "User unathourized",
          });

          return;
        }

        req.user = decoded;
        console.log(decoded);

        next();
      },
    );
  } catch (error) {
    console.log(error);

    res.status(401).send({
      message: "User unathourized",
    });
  }
};

module.exports = {
  registerUser,
  registerOperator,
  verifyUser,
  getUser,
  getUserByOperator,
  loginUser,
  loginOperator,
  updateUser,
  resolveAccount
};