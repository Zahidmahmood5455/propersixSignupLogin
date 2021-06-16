const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const numberController = require('./numberController');
const sendEmail = require('../utils/email');
const Number = require('../model/numberModel');

exports.createNumber = async (req, res, next) => {
  //1) check number its there
  if (!req.body.number) {
    return next(new Error('Please enter number'));
  }

  //2) find number
  const num = await Number.findOne({ number: req.body.number});

  //3) create number if not exist
  if( !num ){
    const newNumber = await Number.create({
      number: req.body.number,
   });
 
    return res.status(200).json({
    status: 'success',
    data: {
     number: newNumber,
    },
    });
  }
  //4) if number already exist
  if(num.verify === true) return next(new Error('This number already verified'));
  else if(num.tokenExpires >= Date.now()) return next(new Error('Already send token for this number'));
  return numberController.updateNumber(res, num._id);
}

exports.verifyToken = async (req, res, next) => {
  //1) For Find number based on token, First encrypt that token
  const hashtoken = crypto
    .createHash('sha256')
    .update(req.body.token)
    .digest('hex');
  
  //2) find number 
  const num = await Number.findOne({
    token: hashtoken,
    tokenExpires: { $gt: Date.now() },
  });
  
  if (!num) return next(new Error('Invalid token or expires Token!'));

  //3)update number
  num.token = undefined;
  num.tokenExpires = undefined;
  num.verify = true;
  await num.save();

  //4) send response
  res.status(200).json({
    status: 'success',
    data: {
     number: num,
    },
    });
 
};


const signToken = (id) =>
  jwt.sign({ id }, 'zahidmahmood-224-computerscience', {
    expiresIn: '90d',
  });

const createSendJWt = (user, statusCode, req, res) => {
  const jwtToken = signToken(user._id);

  res.cookie('jwt', jwtToken, {
    expires: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ),
  });

  res.status(statusCode).json({
    status: 'success',
    jwt: jwtToken,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res, next) => {
    //1) check number verified 
    const num= await Number.findOne({number: req.body.number});
    if(!num || (num.verify === false) ) return next(new Error('Number is not verified'));

    //2) create user
    try {
        const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        number: req.body.number,
        country: req.body.country,
        });
      
      // 3) create link for activate account
        const token = user.createLoginToken();
        await user.save({ validateBeforeSave: false });
        const url = `${req.protocol}://${req.get('host')}/users/activateAccount/${token}`;

      //4) send link to user by email
        await sendEmail({
            email: user.email,
            subject: 'Account Activate Link (Valid for 10 minutes)',
            message: `click on link for activate your account: ${url}`
          });

      //5) delte Number from number collection
        await Number.findByIdAndDelete(num._id);

      //6) send response
        res.status(200).json({
            status: 'success',
            message: "check your provided email and activate your account",
            data: {
                data: user,
            },
        });

    } catch (err) {
             return next(err);
            // res.status(201).json({
            // status: 'fail',
            // message: err.message
        // });
    }
} 

exports.activateUser = async (req, res, next) => {
    //1) For Find user based on token, First encrypt that token
    const hashtoken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      loginToken: hashtoken,
      loginTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new Error('Invalid link or expires Token!',));
    }
  
    //2) Update user
    user.active = true;
    user.loginToken = undefined;
    user.loginTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    //3) send response
      res.status(200).json({
      status: 'success',
      message: 'Activate your account.Now you can login',
  });

}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
  
    //1) check email && password its there
    if (!email && password) {
      return next(new Error('Please Enter Email and Password!'));
    }
  
    //2)check user exist 
    const currentUser = await User.findOne({ email }).select('+password');

    //2 check email and password 
    if ( !currentUser || !(await currentUser.passwordCorrect(currentUser.password, password))) {
      return next(new Error('Incorrect email and password'));
    }

    //3 check user active
    if(currentUser.active === false) 
     return next(new Error('You are not activate.check your email and activate your account'));    
    
     //4 create and send JWT
     createSendJWt(currentUser, 201, req, res);
};
  