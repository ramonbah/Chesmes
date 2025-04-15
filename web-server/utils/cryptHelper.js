let crypto = require('crypto');
let fs = require('fs');

class CryptHelper {
    privateKey = fs.readFileSync('./config/private.pem', 'utf8');
    publicKey = fs.readFileSync('./config/public.pem', 'utf8');

    constructor() {}
    
    static getInstance() {
        if (!CryptHelper.instance) {
            CryptHelper.instance = new CryptHelper();
        }
        return CryptHelper.instance;
    }

    signToken(token) {
        return crypto.publicEncrypt(this.publicKey,
            Buffer.from(token, 'utf8'))
            .toString('base64');
    }
    
    verifyToken(token) {
        try {
            const result = Buffer.from(crypto.privateDecrypt(this.privateKey, Buffer.from(token, 'base64')), 'utf8')
            return true
        } catch {
            return false
        }
    }    
}

module.exports = CryptHelper