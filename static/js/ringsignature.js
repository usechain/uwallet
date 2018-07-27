/**
 * Created by zhouhh on 2018/7/26.
 */

var ethUtil = require('ethereumjs-util')
const Kyber = require("@usechain/kyberjs");
//const SHA3 = require('keccakjs')
const cloneDeep = require("lodash.clonedeep")
/**
 * Creates  SHA-3 Keccak hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Number} [bits=256] the Keccak SHA width
 * @return {Buffer}
 */
//var sha3=ethUtil.sha3

const Sha3 = require('js-sha3')

const hashLengths = [ 224, 256, 384, 512 ]

//convert hex string 2 Uint8Array. It's different from Uint8Array.from(Buffer)
var hexstr2Uint8Array=(hexstr) =>{
    "use strict";
    var len=Math.ceil(hexstr.length/2)
    var u8array=new Uint8Array(len)
    if(hexstr.length%2 !=0) {
        hexstr="0"+hexstr;

    }

    //console.log(`hexstr:${hexstr}`)
    for(var i = 0; i < len; i++) {
        var x=hexstr.substr(i*2,2)
       // console.log(`x:${x}`)
        var value = parseInt(x,16);
        u8array[i]=value;
        //console.log(`i:${i},value:${value}`)

    }
    return u8array
}
var buffer2Uint8Array= (buffer)=>{
    "use strict";
    return Uint8Array.from(buffer)
    // var str=buffer.toString()//31=>'a'
    // var i = 0, l = hex.length;
    // if (hex.substring(0, 2) === '0x') {
    //     i = 2;
    // }
    // for (; i < l; i+=2) {
    //     var code = parseInt(hex.substr(i, 2), 16);
    //     //str += String.fromCharCode(code);
    // }

    // var str=buffer.toString()
    //
    // var len=str.length/2
    // var u8array=new Uint8Array(len)
    // if(str.length%2 !=0) str="0"+str;
    // console.log(`${str}`)
    // for(var i = 0; i < len; i++) {
    //     var x=str.slice(i*2,2)
    //     console.log(`${x}`)
    //     var value = parseInt(x,16);
    //     u8array[i]=value;
    //     console.log(`i:${i},value:${value}`)
    //
    // }
    //
    // return u8array

}
var hash3 = function (bitcount) {
    if (bitcount !== undefined && hashLengths.indexOf(bitcount) == -1)
        throw new Error('Unsupported hash length')
    this.content = []
    this.bitcount = bitcount ? 'keccak_' + bitcount : 'keccak_512'
}
hash3.prototype.getBytes=function() {
    "use strict";
    var _this=this
    var i=0


    function getNextBytes(count) {
        if (!Number.isInteger(count)) {
            throw "count must be a integer";
        }
        let hex = Sha3[_this.bitcount](Buffer.concat(_this.content))
        console.log("sha3 hex:",hex)
        let arrayDigest = hexstr2Uint8Array(hex)
        console.log(`getNextBytes,i:${i},len:${count},arrayDigest.length:${arrayDigest.length},hex:${arrayDigest.toString("hex")}`)
        //todo get count of buffer
        let array =  Uint8Array.from(arrayDigest.subarray(i,count));
        i+=count;
        console.log(`getNextBytes return:${array.length}:${array.toString("hex")}`)
        return array;
        // let array = new Uint8Array(count);
        // blakeInstance.stream(array);
        // return array;


        // if (!this._h0) {
        //     // Finish root hash to get h0.
        //     this._h0 = new Uint8Array(blake2s_1.DIGEST_LENGTH);
        //     this._hash.finish(this._h0);
        // }
        // if (arr.length === 0) {
        //     return this;
        // }
        // if (arr.length > this._left) {
        //     throw new Error("BLAKE2Xs: cannot generate more bytes");
        // }
        // for (var i = 0; i < arr.length; i++) {
        //     if (this._bufPos >= blake2s_1.DIGEST_LENGTH) {
        //         // Fill buffer.
        //         var dlen = (this._left < blake2s_1.DIGEST_LENGTH) ? this._left : blake2s_1.DIGEST_LENGTH;
        //         var h = new blake2s_1.BLAKE2s(dlen, this._outConfig);
        //         h.update(this._h0);
        //         h.finish(this._buf);
        //         h.clean();
        //         this._bufPos = 0;
        //         this._outConfig.tree.nodeOffset++;
        //     }
        //     arr[i] = this._buf[this._bufPos];
        //     this._bufPos++;
        //     this._left--;
        // }
    }

    return getNextBytes;
}
hash3.prototype.update = function (i) {
    if (Buffer.isBuffer(i))
        this.content.push(i)
    else if(i instanceof Uint8Array){
        this.content.push(Buffer.from(i))
    }
    else if (typeof i === 'string')
        this.content.push(new Buffer(i))
    else
        throw new Error('Unsupported argument to update')
    return this
}

hash3.prototype.digest = function (encoding) {
    var result = Sha3[this.bitcount](Buffer.concat(this.content))
    if (encoding === 'hex')
        return result
    else if (encoding === 'binary' || encoding === undefined)
        return new Buffer(result, 'hex').toString('binary')
    else
        throw new Error('Unsupported encoding for digest: ' + encoding)
}

/**
 * Sign a message using ring signature. This method is ported from the Kyber Golang version
 * available at https://github.com/dedis/kyber/blob/master/sign/anon/sig.go. Please refer to the documentation
 * of the given link for detailed instructions. This port stick to the Go implementation, however the hashing function
 * used here is Blake2xs, whereas Blake2xb is used in the Golang version.
 *
 * @param {Kyber.Curve} suite - the crypto suite used for the sign process
 * @param {Uint8Array} message - the message to be signed
 * @param {Array} anonymitySet - an array containing the public keys of the group
 * @param {Integer} mine - the index of the public key of the signer in the anonymity set
 * @param {Uint8Array} privateKey - the private key of the signer
 * @return {Uint8Array} - the signature
 */
function Sign(suite, message, anonymitySet, mine, privateKey) {

    if (!(message instanceof Uint8Array)) {
        throw "message must be Uint8Array";
    }
    if (!(anonymitySet instanceof Array)) {
        throw "anonymitySet must be an Array of Point";
    }

    if (!Number.isInteger(mine)) {
        throw "mine should be an Integer";
    }

    let n = anonymitySet.length;
    let L = anonymitySet.slice(0);//copy anonymitySet
    let pi = mine;


    console.log("message:",message)
    let h3 = new hash3(256)
    console.log("h3:",h3)
    h3.update(Buffer.from(message));
    console.log("h3 update:",h3.digest("hex"))

    //random key
    let s = suite.scalar().pick();

    console.log("suite.scalar().pick() s:",s)

    let S = suite.point().mul(s);
    console.log("suite.point().mul(s):S:",S)
    let x = [];
    let c = [];

    c[(pi + 1) % n] = signH3(suite, h3, S);
    console.log("signH3:",c[(pi + 1) % n])
    let P = suite.point();
    let PG = suite.point();

    for (let i = (pi + 1) % n; i !== pi; i = (i + 1) % n) {
        x[i] = suite.scalar().pick();
        PG.add(PG.mul(x[i]), P.mul(c[i], L[i]));

        c[(i + 1) % n] = signH3(suite, h3, PG);
    }
    x[pi] = suite.scalar();
    x[pi].mul(privateKey, c[pi]).sub(s, x[pi]);

    return encodeSignature(c[0], x);
}

/**
 * Verify the signature of a message  a message using  ring signature. This method is ported from
 * the Kyber Golang version available at https://github.com/dedis/kyber/blob/master/sign/anon/sig.go. Please refer
 * to the documentation of the given link for detailed instructions. This port stick to the Go implementation, however
 * the hashing function used here is Keccak, whereas Blake2xb is used in the Golang version.
 *
 * @param {Kyber.Curve} suite - the crypto suite used for the sign process
 * @param {Uint8Array} message - the message to be signed
 * @param {Array} anonymitySet - an array containing the public keys of the group
 * @param signatureBuffer - the signature the will be verified
 * @return {SignatureVerification} - contains the property of the verification
 */
function Verify(suite, message, anonymitySet, signatureBuffer) {
    if (!(suite instanceof Kyber.Group)) {
        throw "suite must be an instance of a Group";
    }
    if (!(message instanceof Uint8Array)) {
        throw "message must be Uint8Array";
    }
    if (!(anonymitySet instanceof Array)) {
        throw "anonymitySet must be an Array of Point";
    }

    if (!(signatureBuffer instanceof Uint8Array)) {
        throw "signatureBuffer must be Uint8Array";
    }

    let n = anonymitySet.length;
    let L = anonymitySet.slice(0);

    let sig = decodeSignature(suite,signatureBuffer);


    console.log("very sig:",sig)
    let h3 =new hash3(256)
    console.log("h3:",h3)
    h3.update(Buffer.from(message));
    console.log("h3 update:",h3.digest("hex"))

    let P, PG;
    P = suite.point();
    PG = suite.point();

    let s = sig.S;
    let ci = sig.C0;
    console.log(`C0:${ci}`)
    for (let i = 0; i < n; i++) {
        console.log(`verify:${i}`)
        PG.add(PG.mul(s[i]), P.mul(ci, L[i]));

        ci = signH3(suite, h3, PG);
        console.log(`ci${i}:${ci}`)
    }
    if (!ci.equal(sig.C0)) {
        return {
            valid: false
        };
    }

    return {
        valid: true
    };

}

function concatArrays(constructor, arrays) {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new constructor(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}


//



function signH3(suite, hashpre, PG) {
    if (!(suite instanceof Kyber.Group)) {
        throw "suite must be an instance of a Group";
    }
    if (!(PG instanceof Kyber.Point)) {
        throw "PG must be an instance of a Point";
    }

   // let H3 = cloneDeep(hashpre);

    let PGb = PG.marshalBinary();
    hashpre.update(PGb);

    return suite.scalar().pick(hashpre.getBytes());
}

function encodeSignature(c0, s) {
    if (!(c0 instanceof Kyber.Scalar)) {
        throw "c0 must be an instance of a Scalar";
    }
    if (!(s instanceof Array)) {
        throw "s must be an Array of Scalar";
    }


    let array = [];

    array.push(c0.marshalBinary());

    for (let scalar of s) {
        array.push(scalar.marshalBinary());
    }

    return concatArrays(Uint8Array, array);

}

function decodeSignature(suite, signatureBuffer) {
    if (!(suite instanceof Kyber.Group)) {
        throw "suite must be an instance of a Group";
    }
    if (!(signatureBuffer instanceof Uint8Array)) {
        throw "message must be Uint8Array";
    }

    let scalarMarshalSize = suite.scalar().marshalSize();
    let pointMarshalSize = 32//suite.point().marshalSize();

    console.log("signatureBuffer length:",signatureBuffer.length)
    console.log("scalarMarshalSize:",scalarMarshalSize)
    console.log("pointMarshalSize:",pointMarshalSize)
    let c0 = suite.scalar();
    c0.unmarshalBinary(signatureBuffer.slice(0, pointMarshalSize));

    let S = [];
    let endIndex = signatureBuffer.length;
    for (let i = pointMarshalSize; i < endIndex; i += scalarMarshalSize) {
        let Si = suite.scalar();
        Si.unmarshalBinary(signatureBuffer.slice(i, i + scalarMarshalSize));
        S.push(Si);
    }

    let fields = {
        C0: c0,
        S: S,
    };

    return fields;
}

module.exports.Sign = Sign;
module.exports.Verify = Verify;