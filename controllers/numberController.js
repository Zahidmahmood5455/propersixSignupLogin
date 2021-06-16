const twilio = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
const Number = require('../model/numberModel');

exports.sendCodeToNumber = (number, token) => {
    twilio.messages
    .create({
          to: number,
          from: process.env.TWILIO_NUMBER,
          body: `your code for Number Verification ${token}`,
    })
    .then(message => {
          console.log(message.sid);
    })
    .catch(err => console.error(err));
}

exports.updateNumber = async (res,id) => {
  const num = await Number.findById(id);
  console.log(num);
  await num.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      number: num,
    },
  });
}

