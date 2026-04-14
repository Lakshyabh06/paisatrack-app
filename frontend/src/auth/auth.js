import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

// ✅ YOUR VALUES (already you have)
const poolData = {
  UserPoolId: import.meta.env.VITE_USER_POOL_ID,
  ClientId: import.meta.env.VITE_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

// ✅ GET CURRENT USER
export const getCurrentUser = () => {
  return userPool.getCurrentUser();
};

// ✅ LOGIN FUNCTION
export const login = (email, password) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        resolve(user);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

// ✅ SIGNUP FUNCTION
export const signup = (email, password) => {
  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, [], null, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// ✅ 🔥 NEW: CONFIRM SIGNUP (OTP VERIFY)
export const confirmSignup = (email, code) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    user.confirmRegistration(code, true, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// ✅ LOGOUT
export const logout = () => {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
  }
};
