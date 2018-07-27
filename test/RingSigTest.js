// "use strict";
//
// const ChaiAsPromised = require("chai-as-promised");
// var chai=require('chai')
// chai.use(ChaiAsPromised);
// chai.should();
// const Kyber = require("../static/js/kyber");
// const secp256k1 = Kyber.curve.secp256k1;
// const BN = require("bn.js");
// const assert = require("chai").assert;
//
//
//
//
// //const suite = new Kyber.curve.edwards25519.Curve;
// const suite = new  secp256k1.Curve(secp256k1.Params.k256);
// const RingSig = require("../static/js/ringsig");
//
// describe("RingSig", function () {
//   it('should correctly sign and verify with only one signer', function () {
//     let X = [suite.point()];
//     console.log("X:",X)
//     let mine = 0;
//     //  callback - to generate random Uint8Array of given length
//     //function callback(len){}
//       var crypto=require("crypto")
//     var v=crypto.randomBytes
//      console.log("v",v(32))
//     let x = suite.scalar().pick(v);
//       console.log("x:",x)
//     X[mine].mul(x);
//       console.log("X[mine]:",X[mine])
//     let M = Uint8Array.from([1, 2, 3, 4]);
//     let sig = RingSig.Sign(suite, M, X, undefined, mine, x);
//
//     const goodMessageVerif = RingSig.Verify(suite, M, X, undefined, sig);
//     goodMessageVerif.valid.should.be.true;
//
//     const badMessageVerif = RingSig.Verify(suite, Uint8Array.from([0, 1]), X, undefined, sig);
//     badMessageVerif.valid.should.be.false;
//
//   });
//
//   it('should correctly sign and verify with a group of anonymity', function () {
//     let X = [];
//     for (let i = 0; i < 3; i++) {
//       X.push(suite.point().pick())
//     }
//
//     let mine = 1;
//     let x = suite.scalar().pick();
//     X[mine] = suite.point().mul(x);
//
//     let M = Uint8Array.from([1, 2, 3, 4, 5]);
//     let sig = RingSig.Sign(suite, M, X, undefined, mine, x);
//
//
//     let badMessageVerify = RingSig.Verify(suite, Uint8Array.from([1, 2]), X, undefined, sig);
//     badMessageVerify.valid.should.be.false;
//
//     let goodMessageVerify = RingSig.Verify(suite, M, X, undefined, sig);
//     goodMessageVerify.valid.should.be.true;
//
//   });
//
//   it('should correctly sign and verify with a group and linkable signature', function () {
//     let X = [];
//     for (let i = 0; i < 3; i++) {
//       X.push(suite.point().pick())
//     }
//
//     let mine1 = 1;
//     let mine2 = 2;
//     let x1 = suite.scalar().pick();
//     let x2 = suite.scalar().pick();
//     X[mine1] = suite.point().mul(x1);
//     X[mine2] = suite.point().mul(x2);
//
//     let M = Uint8Array.from([1, 2, 3, 4]);
//     let S = Uint8Array.from([5, 6, 7, 8]);
//     let sig = [];
//     sig.push(RingSig.Sign(suite, M, X, S, mine1, x1));
//     sig.push(RingSig.Sign(suite, M, X, S, mine1, x1));
//     sig.push(RingSig.Sign(suite, M, X, S, mine2, x2));
//     sig.push(RingSig.Sign(suite, M, X, S, mine2, x2));
//
//     let tag = [];
//     for (let i = 0; i < sig.length; i++) {
//       let value = RingSig.Verify(suite, M, X, S, sig[i]);
//       value.valid.should.be.true;
//
//       tag[i] = value.tag;
//       tag[i].length.should.equal(suite.point().marshalSize());
//
//
//       let BAD = Uint8Array.from([0, 1, 1]);
//       let badtag = RingSig.Verify(suite, BAD, X, S, sig[i]);
//       badtag.valid.should.be.false;
//
//     }
//
//     tag[0].toString().should.equal(tag[1].toString());
//     tag[2].toString().should.equal(tag[3].toString());
//     tag[0].toString().should.not.equal(tag[2].toString());
//
//   });
// });