export const PASSWORD_MIN_LENGTH = 4;
export const PASSWORD_MAX_LENGTH = 10;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,10}$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 10;

export const PASSWORD_REGEX_ERROR = "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character";