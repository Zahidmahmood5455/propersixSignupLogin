const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}:${err.value}`;
    return new Error(message);
  };

const handleDuplicateFieldsDB = (err) => {
    const message = `Already someone has'${
      Object.values(err.keyValue)[0]
    }'.Please use another.`;
    return new Error(message);
};  

const handleValidationErrorDB = (err) => {
    console.log(2);
    const errMsgs = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data.${errMsgs.join(' ')}`;
    return new Error(message);
};

const globalErrorHandler = (err, req, res, next) => {

    // console.log(err);
    let error = { ...err };
      //resolve error message problem
      error.message = err.message;
  
      if (err.name === 'CastError') error = handleCastErrorDB(error);
      if (err.code === 11000) error = handleDuplicateFieldsDB(error);
      if (err.name === 'ValidationError') error = handleValidationErrorDB(error);

    //   if(error.message.startsWith('Invalid input data')){
    //       error.message = error.message.split('.')[1];
    //   }

      res.status(401).json({
        status: 'fail',
        message: error.message,
      });
}

module.exports = globalErrorHandler;