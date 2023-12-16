export class PasswordValidator {
    password: string;

    setPassword(password: string) {
        this.password = password;
    }

    validatePassword(claimedPassword: string) {
        return this.password === claimedPassword;
    }
}
