exports.generateOtp = () => {
  // return Math.floor(100000 + Math.random() * 900000).toString();
  return '123456'; // Default OTP for testing
};

exports.clients = new Map();
