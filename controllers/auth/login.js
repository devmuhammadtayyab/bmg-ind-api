import { GenerateToken } from '../../middlewares/auth';

import { HTTP_CODES } from '../../routes/utils/constants';

const LogIn = async ({ userId, email }) => {
  const { token } = GenerateToken({
    userId,
    email,
    expiryTime: '7d'
  });

  if (token) {
    return {
      token,
      message: 'Sign In Successfully'
    };
  }

  const err = new Error();
  err.statusCode = HTTP_CODES.UNAUTHORIZED;
  err.errorMessage = 'Issue in token generation failed';

  throw err;
};

export default LogIn;
