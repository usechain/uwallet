/**
 * Created by zhouhh on 2018/7/18.
 */
"use strict";

const Kyber = require("@dedis/kyber-js");
const Blake = require("@stablelib/blake2xs").BLAKE2Xs;
const cloneDeep = require("lodash.clonedeep");

/**
 * @typedef {Object} SignatureVerification
 * @property {boolean} valid -  true if the siganture is valid
 * @property {Uint8Array} [tag] - The Tag of the signer (present only if linkable signature is used)
 */

/**
 * Sign a message using (un)linkable ring signature. This method is ported from the Kyber Golang version
 * available at https://github.com/dedis/kyber/blob/master/sign/anon/sig.go. Please refer to the documentation
 * of the given link for detailed instructions. This port stick to the Go implementation, however the hashing function
 * used here is Blake2xs, whereas Blake2xb is used in the Golang version.
 *
 * @param {Kyber.Curve} suite - the crypto suite used for the sign process
 * @param {Uint8Array} message - the message to be signed
 * @param {Array} anonymitySet - an array containing the public keys of the group
 * @param [linkScope] - ths link scope used for linkable signature
 * @param {Integer} mine - the index of the public key of the signer in the anonymity set
 * @param {Uint8Array} privateKey - the private key of the signer
 * @return {Uint8Array} - the signature
 */
function Sign(suite, message, anonymitySet, linkScope, mine, privateKey) {
    if (!(suite instanceof Kyber.Group)) {
        throw "suite must be an instance of a Group";
    }
    if (!(message instanceof Uint8Array)) {
        throw "message must be Uint8Array";
    }
    if (!(anonymitySet instanceof Array)) {
        throw "anonymitySet must be an Array of Point";
    }
    if (linkScope !== undefined && !(linkScope instanceof Uint8Array)) {
        throw "linkScope must be Uint8Array";
    }
    if (!Number.isInteger(mine)) {
        throw "mine should be an Integer";
    }
    if (!(privateKey instanceof Kyber.Scalar)) {
        throw "privateKey must be an instance of a Scalar";
    }

    let n = anonymitySet.length;
    let L = anonymitySet.slice(0);
    let pi = mine;

    let linkBase;
    let linkTag;

    if (linkScope !== undefined) {
        let linkStream = new Blake(undefined, {key: linkScope});
        linkBase = suite.point().pick(createStreamFromBlake(linkStream));
        linkTag = suite.point().mul(privateKey, linkBase);
    }

    let H1pre = signH1pre(suite, linkScope, linkTag, message);

    let u = suite.scalar().pick();
    let UB = suite.point().mul(u);
    let UL;
    if (linkScope !== undefined) {
        UL = suite.point().mul(u, linkBase);
    }

    let s = [];
    let c = [];

    c[(pi + 1) % n] = signH1(suite, H1pre, UB, UL);

    let P = suite.point();
    let PG = suite.point();
    let PH;
    if (linkScope !== undefined) {
        PH = suite.point();
    }
    for (let i = (pi + 1) % n; i !== pi; i = (i + 1) % n) {
        s[i] = suite.scalar().pick();
        PG.add(PG.mul(s[i]), P.mul(c[i], L[i]));
        if (linkScope !== undefined) {
            PH.add(PH.mul(s[i], linkBase), P.mul(c[i], linkTag));
        }
        c[(i + 1) % n] = signH1(suite, H1pre, PG, PH);
    }
    s[pi] = suite.scalar();
    s[pi].mul(privateKey, c[pi]).sub(u, s[pi]);

    return encodeSignature(c[0], s, linkTag);
}

/**
 * Verify the signature of a message  a message using (un)linkable ring signature. This method is ported from
 * the Kyber Golang version available at https://github.com/dedis/kyber/blob/master/sign/anon/sig.go. Please refer
 * to the documentation of the given link for detailed instructions. This port stick to the Go implementation, however
 * the hashing function used here is Blake2xs, whereas Blake2xb is used in the Golang version.
 *
 * @param {Kyber.Curve} suite - the crypto suite used for the sign process
 * @param {Uint8Array} message - the message to be signed
 * @param {Array} anonymitySet - an array containing the public keys of the group
 * @param [linkScope] - ths link scope used for linkable signature
 * @param signatureBuffer - the signature the will be verified
 * @return {SignatureVerification} - contains the property of the verification
 */
function Verify(suite, message, anonymitySet, linkScope, signatureBuffer) {
    if (!(suite instanceof Kyber.Group)) {
        throw "suite must be an instance of a Group";
    }
    if (!(message instanceof Uint8Array)) {
        throw "message must be Uint8Array";
    }
    if (!(anonymitySet instanceof Array)) {
        throw "anonymitySet must be an Array of Point";
    }
    if (linkScope !== undefined && !(linkScope instanceof Uint8Array)) {
        throw "linkScope must be Uint8Array";
    }
    if (!(signatureBuffer instanceof Uint8Array)) {
        throw "signatureBuffer must be Uint8Array";
    }

    let n = anonymitySet.length;
    let L = anonymitySet.slice(0);

    let linkBase, linkTag;
    let sig = decodeSignature(
        suite,
        signatureBuffer,
        linkScope !== undefined
    );

    if (linkScope !== undefined) {
        let linkStream = new Blake(undefined, {key: linkScope});
        linkBase = suite.point().pick(createStreamFromBlake(linkStream));
        linkTag = sig.Tag;
    }

    let H1pre = signH1pre(suite, linkScope, linkTag, message);

    let P, PG, PH;
    P = suite.point();
    PG = suite.point();
    if (linkScope !== undefined) {
        PH = suite.point();
    }
    let s = sig.S;
    let ci = sig.C0;
    for (let i = 0; i < n; i++) {
        PG.add(PG.mul(s[i]), P.mul(ci, L[i]));
        if (linkScope !== undefined) {
            PH.add(PH.mul(s[i], linkBase), P.mul(ci, linkTag));
        }
        ci = signH1(suite, H1pre, PG, PH);
    }
    if (!ci.equal(sig.C0)) {
        return {
            valid: false
        };
    }

    if (linkScope !== undefined) {
        let tag = linkTag.marshalBinary();
        return {
            valid: true,
            tag: tag
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

function createStreamFromBlake(blakeInstance) {
    if (!(blakeInstance instanceof Blake)) {
        throw "blakeInstance must be of type Blake2xs";
    }

    function getNextBytes(count) {
        if (!Number.isInteger(count)) {
            throw "count must be a integer";
        }
        let array = new Uint8Array(count);
        blakeInstance.stream(array);
        return array;
    }

    return getNextBytes;
}

function signH1pre(suite, linkScope, linkTag, message) {
    if (!(suite instanceof Kyber.Group)) {
        throw "suite must be an instance of a Group";
    }
    if (linkScope !== undefined && !(linkScope instanceof Uint8Array)) {
        throw "linkScope must be Uint8Array";
    }
    if (linkTag !== undefined && !(linkTag instanceof Kyber.Point)) {
        throw "linkTag must be an instance of a Point";
    }
    if (!(message instanceof Uint8Array)) {
        throw "message must be Uint8Array";
    }

    let H1pre = new Blake(undefined, {key: message});

    if (linkScope !== undefined) {
        H1pre.update(linkScope);
        let tag = linkTag.marshalBinary();
        H1pre.update(tag);
    }

    return H1pre;
}

function signH1(suite, H1pre, PG, PH) {
    if (!(suite instanceof Kyber.Group)) {
        throw "suite must be an instance of a Group";
    }
    if (!(PG instanceof Kyber.Point)) {
        throw "PG must be an instance of a Point";
    }
    if (PH !== undefined && !(PH instanceof Kyber.Point)) {
        throw "PH must be an instance of a Point";
    }


    let H1 = cloneDeep(H1pre);

    let PGb = PG.marshalBinary();
    H1.update(PGb);
    if (PH !== undefined) {
        let PHb = PH.marshalBinary();
        H1.update(PHb);
    }
    return suite.scalar().pick(createStreamFromBlake(H1));
}

function encodeSignature(c0, s, linkTag) {
    if (!(c0 instanceof Kyber.Scalar)) {
        throw "c0 must be an instance of a Scalar";
    }
    if (!(s instanceof Array)) {
        throw "s must be an Array of Scalar";
    }
    if (linkTag !== undefined && !(linkTag instanceof Kyber.Point)) {
        throw "linkTag must be an instance of a Point";
    }

    let array = [];

    array.push(c0.marshalBinary());

    for (let scalar of s) {
        array.push(scalar.marshalBinary());
    }

    if (linkTag !== undefined) {
        array.push(linkTag.marshalBinary());
    }

    return concatArrays(Uint8Array, array);

}

function decodeSignature(suite, signatureBuffer, isLinkableSig) {
    if (!(suite instanceof Kyber.Group)) {
        throw "suite must be an instance of a Group";
    }
    if (!(signatureBuffer instanceof Uint8Array)) {
        throw "message must be Uint8Array";
    }
    if (typeof isLinkableSig !== "boolean") {
        throw new Error("isLinkableSig must be of type boolean");
    }
    let scalarMarshalSize = suite.scalar().marshalSize();
    let pointMarshalSize = suite.point().marshalSize();


    let c0 = suite.scalar();
    c0.unmarshalBinary(signatureBuffer.slice(0, pointMarshalSize));

    let S = [];
    let endIndex = isLinkableSig ? signatureBuffer.length - pointMarshalSize : signatureBuffer.length;
    for (let i = pointMarshalSize; i < endIndex; i += scalarMarshalSize) {
        let Si = suite.scalar();
        Si.unmarshalBinary(signatureBuffer.slice(i, i + scalarMarshalSize));
        S.push(Si);
    }

    let fields = {
        C0: c0,
        S: S,
    };

    if (isLinkableSig) {
        let Tag = suite.point();
        Tag.unmarshalBinary(signatureBuffer.slice(endIndex));
        fields.Tag = Tag;
    }

    return fields;
}

module.exports.Sign = Sign;
module.exports.Verify = Verify;